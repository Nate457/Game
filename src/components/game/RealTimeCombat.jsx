import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { CLASSES, applySkillTreeBonuses } from "@/lib/gameData";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Swords, Shield, Heart, Zap } from "lucide-react";

export default function RealTimeCombat({ character, enemyData, sessionId, isHost, onCombatEnd, onFlee }) {
  const [session, setSession] = useState(null);
  const [cooldowns, setCooldowns] = useState({});
  const [myMana, setMyMana] = useState(character.max_mana);
  const [combatLogs, setCombatLogs] = useState([]);
  const arenaRef = useRef(null);

  // 1. LISTEN TO FIREBASE FOR LIVE UPDATES
  useEffect(() => {
    if (!sessionId) return;
    const unsubscribe = base44.entities.CoopSession.listen(sessionId, (data) => {
      setSession(data);
      if (data.status === "victory" || data.status === "defeat") {
        onCombatEnd({ 
          victory: data.status === "victory", 
          playerHp: isHost ? data.host.hp : data.guest.hp,
          playerMana: myMana,
          totalDamage: 100 // Simplified for brevity
        }); 
      }
    });
    return () => unsubscribe();
  }, [sessionId, onCombatEnd, isHost, myMana]);

  // 2. HOST CONTROLS THE ENEMY AI (Only runs on Host's computer)
  useEffect(() => {
    if (!isHost || !session || !session.enemy || session.status !== "active") return;
    
    // The Boss thinks every 1.5 seconds
    const aiInterval = setInterval(async () => {
      let target = session.host;
      let targetKey = "host";

      // Find closest player
      const hostDist = Math.hypot(session.enemy.tx - session.host.tx, session.enemy.ty - session.host.ty);
      if (session.guest && session.guest.hp > 0) {
        const guestDist = Math.hypot(session.enemy.tx - session.guest.tx, session.enemy.ty - session.guest.ty);
        if (guestDist < hostDist || session.host.hp <= 0) {
          target = session.guest;
          targetKey = "guest";
        }
      }

      if (target.hp <= 0) return; // Everyone is dead

      let newHp = target.hp;
      const currentDist = Math.hypot(session.enemy.tx - target.tx, session.enemy.ty - target.ty);

      // If close enough, Attack!
      if (currentDist < 90) {
        newHp -= session.enemy.attack; 
      }

      // Move towards the target (but don't overlap completely)
      const angle = Math.atan2(target.ty - session.enemy.ty, target.tx - session.enemy.tx);
      const moveDistance = 80; // Boss speed
      const newTx = session.enemy.tx + Math.cos(angle) * moveDistance;
      const newTy = session.enemy.ty + Math.sin(angle) * moveDistance;

      await base44.entities.CoopSession.update(sessionId, {
        "enemy.tx": newTx,
        "enemy.ty": newTy,
        [`${targetKey}.hp`]: newHp
      });

      if (newHp <= 0 && session.host.hp <= 0 && (!session.guest || session.guest.hp <= 0)) {
        await base44.entities.CoopSession.update(sessionId, { status: "defeat" });
      }

    }, 1500);

    return () => clearInterval(aiInterval);
  }, [isHost, session, sessionId]);

  // 3. MANA REGEN & COOLDOWN TICKER (Local)
  useEffect(() => {
    const ticker = setInterval(() => {
      setCooldowns(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => { next[k] = Math.max(0, next[k] - 1); });
        return next;
      });
      setMyMana(m => Math.min(character.max_mana, m + 5)); // Regen 5 mana/sec
    }, 1000);
    return () => clearInterval(ticker);
  }, [character.max_mana]);

  // 4. MOVEMENT (Click on Arena)
  const handleMapClick = async (e) => {
    if (!session || session.status !== "active") return;
    const myPlayer = isHost ? session.host : session.guest;
    if (myPlayer.hp <= 0) return; // Dead players can't move

    const rect = arenaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const playerKey = isHost ? "host" : "guest";
    // Sync our new target destination to Firebase
    await base44.entities.CoopSession.update(sessionId, {
      [`${playerKey}.tx`]: x,
      [`${playerKey}.ty`]: y
    });
  };

  // 5. ATTACKING
  const handleAttack = async (ability) => {
    if (!session || !session.enemy) return;
    if (cooldowns[ability.id] > 0) return;
    if (myMana < ability.mana_cost) return;

    const myData = isHost ? session.host : session.guest;
    if (myData.hp <= 0) return;

    const dist = Math.hypot(session.enemy.tx - myData.tx, session.enemy.ty - myData.ty);

    // Range Check: Mages/Healers shoot far, Warriors/Rogues need to be close
    const isRanged = character.class_type === "mage" || character.class_type === "healer";
    const requiredRange = isRanged ? 350 : 100;
    
    if (dist > requiredRange) {
      setCombatLogs(prev => [`Target out of range! Move closer.`, ...prev].slice(0, 4));
      return;
    }

    // Apply Cost & Cooldown locally
    setMyMana(m => m - ability.mana_cost);
    setCooldowns(prev => ({ ...prev, [ability.id]: ability.cooldown || 2 }));

    const boosted = applySkillTreeBonuses(character, character.class_type, character.skill_tree);
    const damage = Math.floor(boosted.attack * (ability.damage_mult || 1));
    const newEnemyHp = session.enemy.hp - damage;

    setCombatLogs(prev => [`You hit the boss for ${damage}!`, ...prev].slice(0, 4));

    if (newEnemyHp <= 0) {
      await base44.entities.CoopSession.update(sessionId, { "enemy.hp": 0, status: "victory" });
    } else {
      await base44.entities.CoopSession.update(sessionId, { "enemy.hp": newEnemyHp });
    }
  };

  if (!session) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto w-10 h-10" /></div>;

  const myAbilities = CLASSES[character.class_type]?.abilities || [];
  const me = isHost ? session.host : session.guest;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto flex flex-col h-[85vh]">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="font-heading font-bold text-xl text-primary flex items-center gap-2">
            <Swords /> Arena (Code: {session.code})
          </h2>
          <p className="text-xs text-muted-foreground">Click the map to move. Use abilities when in range.</p>
        </div>
        <Button onClick={onFlee} variant="destructive" size="sm">Flee</Button>
      </div>

      {/* THE 2D BATTLE ARENA */}
      <div 
        ref={arenaRef}
        onClick={handleMapClick}
        className="flex-1 bg-slate-900 rounded-xl border-2 border-border/50 relative overflow-hidden cursor-crosshair shadow-inner"
        style={{ 
          backgroundImage: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)',
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 0 20px, 20px -20px, -20px 0px'
        }}
      >
        {/* Host Player Token */}
        {session.host && session.host.hp > 0 && (
          <motion.div 
            animate={{ left: session.host.tx, top: session.host.ty }}
            transition={{ duration: 0.8, ease: "linear" }}
            className="absolute w-12 h-12 -ml-6 -mt-6 bg-blue-600/80 rounded-full border-2 border-blue-400 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(37,99,235,0.5)] z-20"
          >
            {CLASSES[session.host.class]?.icon || "👤"}
            <div className="absolute -bottom-4 w-12 h-1.5 bg-red-950 rounded overflow-hidden">
              <div className="h-full bg-green-500" style={{width:`${(session.host.hp/session.host.max_hp)*100}%`}}></div>
            </div>
            <div className="absolute -top-5 text-[10px] font-bold text-white whitespace-nowrap bg-black/50 px-1 rounded">{session.host.name}</div>
          </motion.div>
        )}

        {/* Guest Player Token */}
        {session.guest && session.guest.hp > 0 && (
          <motion.div 
            animate={{ left: session.guest.tx, top: session.guest.ty }}
            transition={{ duration: 0.8, ease: "linear" }}
            className="absolute w-12 h-12 -ml-6 -mt-6 bg-emerald-600/80 rounded-full border-2 border-emerald-400 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(16,185,129,0.5)] z-20"
          >
            {CLASSES[session.guest.class]?.icon || "👤"}
            <div className="absolute -bottom-4 w-12 h-1.5 bg-red-950 rounded overflow-hidden">
              <div className="h-full bg-green-500" style={{width:`${(session.guest.hp/session.guest.max_hp)*100}%`}}></div>
            </div>
            <div className="absolute -top-5 text-[10px] font-bold text-white whitespace-nowrap bg-black/50 px-1 rounded">{session.guest.name}</div>
          </motion.div>
        )}

        {/* Enemy Token */}
        {session.enemy && session.enemy.hp > 0 && (
          <motion.div 
            animate={{ left: session.enemy.tx, top: session.enemy.y }}
            transition={{ duration: 1.5, ease: "linear" }}
            className="absolute w-24 h-24 -ml-12 -mt-12 bg-red-950/80 rounded-xl border-4 border-red-500 flex items-center justify-center text-5xl shadow-[0_0_30px_rgba(239,68,68,0.4)] z-10"
          >
            😈
            <div className="absolute -bottom-5 w-24 h-2.5 bg-slate-900 rounded overflow-hidden border border-border">
              <div className="h-full bg-red-500" style={{width:`${(session.enemy.hp/session.enemy.max_hp)*100}%`}}></div>
            </div>
            <div className="absolute -top-6 text-xs font-bold text-red-400 whitespace-nowrap font-heading uppercase">{session.enemy.name}</div>
          </motion.div>
        )}
      </div>

      {/* COMBAT LOGS */}
      <div className="h-16 mt-2 bg-card rounded-lg border border-border/50 p-2 overflow-hidden text-xs text-muted-foreground flex flex-col justify-end">
        {combatLogs.map((log, i) => <div key={i} className="animate-in fade-in slide-in-from-bottom-2">{log}</div>)}
      </div>

      {/* MY HUD & ABILITIES */}
      <div className="mt-2 flex gap-4 h-24">
        {/* Personal Status */}
        <div className="w-32 bg-card border border-border/50 rounded-xl p-3 flex flex-col justify-center">
          <div className="text-xs font-bold mb-1 truncate">{character.name}</div>
          <div className="flex items-center gap-1 text-xs text-red-400 mb-1"><Heart className="w-3 h-3" /> {Math.max(0, me?.hp || 0)}</div>
          <div className="flex items-center gap-1 text-xs text-blue-400"><Zap className="w-3 h-3" /> {myMana}</div>
        </div>

        {/* Action Bar */}
        <div className="flex-1 grid grid-cols-4 gap-2">
          {myAbilities.slice(0,4).map(ability => {
            const isReady = (cooldowns[ability.id] || 0) === 0 && myMana >= ability.mana_cost;
            return (
              <Button 
                key={ability.id} 
                variant="outline" 
                disabled={!isReady || me?.hp <= 0}
                className={`h-full flex flex-col relative overflow-hidden transition-all ${isReady ? 'hover:bg-primary/20 hover:border-primary border-border/50' : 'opacity-50'}`}
                onClick={() => handleAttack(ability)}
              >
                {cooldowns[ability.id] > 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-lg font-bold text-white z-10">{cooldowns[ability.id]}s</div>
                )}
                <span className="font-heading text-sm mb-1">{ability.name}</span>
                <span className="text-[10px] text-blue-400">{ability.mana_cost} MP</span>
              </Button>
            );
          })}
        </div>
      </div>

    </div>
  );
}