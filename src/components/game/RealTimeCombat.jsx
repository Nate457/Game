import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { CLASSES, applySkillTreeBonuses } from "@/lib/gameData";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Swords } from "lucide-react";

export default function RealTimeCombat({ character, enemyData, sessionId, isHost, onCombatEnd, onFlee }) {
  const [session, setSession] = useState(null);
  const [localPos, setLocalPos] = useState({ x: 100, y: 200 });
  const arenaRef = useRef(null);

  // 1. LISTEN TO FIREBASE FOR LIVE UPDATES
  useEffect(() => {
    if (!sessionId) return;
    const unsubscribe = base44.entities.CoopSession.listen(sessionId, (data) => {
      setSession(data);
      // Check for combat over
      if (data.status === "victory" || data.status === "defeat") {
        onCombatEnd({ victory: data.status === "victory", totalDamage: 100 }); 
      }
    });
    return () => unsubscribe();
  }, [sessionId, onCombatEnd]);

  // 2. HOST CONTROLS THE ENEMY AI (Only runs on Host's computer)
  useEffect(() => {
    if (!isHost || !session || !session.enemy || session.status !== "active") return;
    
    const aiInterval = setInterval(async () => {
      // Very simple AI: Move toward whoever is closest, and damage them if in range
      const hostDist = Math.hypot(session.enemy.x - session.host.x, session.enemy.y - session.host.y);
      let target = session.host;
      let targetKey = "host";

      if (session.guest) {
        const guestDist = Math.hypot(session.enemy.x - session.guest.x, session.enemy.y - session.guest.y);
        if (guestDist < hostDist) {
          target = session.guest;
          targetKey = "guest";
        }
      }

      let newHp = target.hp;
      if (hostDist < 80) {
        newHp -= session.enemy.attack; // Hit!
      }

      await base44.entities.CoopSession.update(sessionId, {
        "enemy.tx": target.x,
        "enemy.ty": target.y,
        "enemy.x": session.enemy.x + (target.x - session.enemy.x) * 0.5, // Move 50% of the way there
        "enemy.y": session.enemy.y + (target.y - session.enemy.y) * 0.5,
        [`${targetKey}.hp`]: newHp
      });

      if (newHp <= 0) {
        await base44.entities.CoopSession.update(sessionId, { status: "defeat" });
      }

    }, 1000); // 1 tick per second to save Firebase quota

    return () => clearInterval(aiInterval);
  }, [isHost, session, sessionId]);

  // 3. MOVEMENT (Click on Arena)
  const handleMapClick = async (e) => {
    if (!session || session.status !== "active") return;
    
    const rect = arenaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setLocalPos({ x, y }); // Update instantly locally for smoothness

    // Tell Firebase where we are going
    const playerKey = isHost ? "host" : "guest";
    await base44.entities.CoopSession.update(sessionId, {
      [`${playerKey}.tx`]: x,
      [`${playerKey}.ty`]: y,
      [`${playerKey}.x`]: x, // Teleporting for MVP simplicity. In a huge engine, we'd interpolate.
      [`${playerKey}.y`]: y
    });
  };

  // 4. ATTACKING
  const handleAttack = async (ability) => {
    if (!session || !session.enemy) return;

    const myData = isHost ? session.host : session.guest;
    const dist = Math.hypot(session.enemy.x - myData.x, session.enemy.y - myData.y);

    // Range Check (Melee vs Ranged)
    const requiredRange = character.class_type === "mage" || character.class_type === "healer" ? 300 : 80;
    
    if (dist > requiredRange) {
      alert("Out of Range! Move closer.");
      return;
    }

    const damage = Math.floor(character.attack * (ability.damage_mult || 1));
    const newEnemyHp = session.enemy.hp - damage;

    if (newEnemyHp <= 0) {
      await base44.entities.CoopSession.update(sessionId, { 
        "enemy.hp": 0, 
        status: "victory" 
      });
    } else {
      await base44.entities.CoopSession.update(sessionId, { "enemy.hp": newEnemyHp });
    }
  };

  // 5. HOST SPAWNS ENEMY TO START
  const handleStartFight = async () => {
    await base44.entities.CoopSession.update(sessionId, {
      status: "active",
      enemy: { 
        name: "Void Behemoth", hp: 1000, max_hp: 1000, attack: 15,
        x: 350, y: 150, tx: 350, ty: 150 
      }
    });
  };

  if (!session) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto w-10 h-10" /></div>;

  const me = isHost ? session.host : session.guest;
  const myAbilities = CLASSES[character.class_type]?.abilities || [];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto flex flex-col h-[80vh]">
      
      <div className="flex justify-between mb-4">
        <h2 className="font-heading font-bold text-xl text-primary">Room Code: {session.code}</h2>
        {isHost && session.status === "lobby" && (
          <Button onClick={handleStartFight} disabled={!session.guest}>
            {session.guest ? "Start Boss Fight" : "Waiting for Guest..."}
          </Button>
        )}
      </div>

      {/* THE 2D BATTLE ARENA */}
      <div 
        ref={arenaRef}
        onClick={handleMapClick}
        className="flex-1 bg-slate-900 rounded-xl border-2 border-border/50 relative overflow-hidden cursor-crosshair shadow-inner"
        style={{ backgroundImage: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)' }}
      >
        {/* Host Player Token */}
        {session.host && (
          <div 
            className="absolute w-10 h-10 -ml-5 -mt-5 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold transition-all duration-500 z-20"
            style={{ left: session.host.x, top: session.host.y }}
          >
            P1
            <div className="absolute -top-4 w-12 h-1.5 bg-red-900 rounded"><div className="h-full bg-green-500 rounded" style={{width:`${(session.host.hp/session.host.max_hp)*100}%`}}></div></div>
          </div>
        )}

        {/* Guest Player Token */}
        {session.guest && (
          <div 
            className="absolute w-10 h-10 -ml-5 -mt-5 bg-green-600 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold transition-all duration-500 z-20"
            style={{ left: session.guest.x, top: session.guest.y }}
          >
            P2
            <div className="absolute -top-4 w-12 h-1.5 bg-red-900 rounded"><div className="h-full bg-green-500 rounded" style={{width:`${(session.guest.hp/session.guest.max_hp)*100}%`}}></div></div>
          </div>
        )}

        {/* Enemy Token */}
        {session.enemy && (
          <div 
            className="absolute w-20 h-20 -ml-10 -mt-10 bg-red-900 rounded-lg border-4 border-red-500 flex items-center justify-center text-3xl transition-all duration-1000 z-10"
            style={{ left: session.enemy.x, top: session.enemy.y }}
          >
            😈
            <div className="absolute -top-6 w-24 h-2 bg-slate-900 rounded"><div className="h-full bg-red-500 rounded" style={{width:`${(session.enemy.hp/session.enemy.max_hp)*100}%`}}></div></div>
          </div>
        )}
      </div>

      {/* ABILITY BAR */}
      {session.status === "active" && (
        <div className="h-24 mt-4 grid grid-cols-4 gap-2">
          {myAbilities.slice(0,4).map(ability => (
            <Button 
              key={ability.id} 
              variant="outline" 
              className="h-full flex flex-col bg-card hover:bg-primary/20 hover:border-primary"
              onClick={() => handleAttack(ability)}
            >
              <Swords className="w-5 h-5 mb-1" />
              <span className="text-xs font-bold">{ability.name}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}