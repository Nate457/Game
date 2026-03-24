import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { CLASSES, applySkillTreeBonuses } from "@/lib/gameData";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Swords, Heart, Zap } from "lucide-react";

export default function RealTimeCombat({ character, enemyData, sessionId, isHost, onCombatEnd, onFlee }) {
  const [session, setSession] = useState(null);
  const [cooldowns, setCooldowns] = useState({});
  const [myMana, setMyMana] = useState(character.max_mana);
  const [combatLogs, setCombatLogs] = useState([]);
  const arenaRef = useRef(null);

  // 1. INITIALIZATION & SYNCING
  useEffect(() => {
    if (sessionId) {
      // CO-OP: Listen to Firebase
      const unsubscribe = base44.entities.CoopSession.listen(sessionId, (data) => {
        setSession(data);
        if (data.status === "victory" || data.status === "defeat") {
          onCombatEnd({ victory: data.status === "victory", totalDamage: 100 }); 
        }
      });
      return () => unsubscribe();
    } else if (enemyData && !session) {
      // SOLO: Initialize Local State Match
      setSession({
        status: "active",
        host: { id: character.id, name: character.name, class: character.class_type, hp: character.max_hp, max_hp: character.max_hp, x: 100, y: 200 },
        guest: null,
        enemy: { ...enemyData, x: 350, y: 150, max_hp: enemyData.hp }
      });
    }
  }, [sessionId, enemyData, character, onCombatEnd]);

  // Unified update function (handles both Solo and Firebase seamlessly)
  const updateGame = async (updates) => {
    if (sessionId) {
      await base44.entities.CoopSession.update(sessionId, updates);
    } else {
      setSession(prev => {
        const next = JSON.parse(JSON.stringify(prev)); // Deep copy
        for (const [key, value] of Object.entries(updates)) {
          const parts = key.split('.');
          if (parts.length === 1) next[key] = value;
          else if (parts.length === 2) next[parts[0]][parts[1]] = value;
        }
        if (next.enemy.hp <= 0) next.status = "victory";
        if (next.host.hp <= 0) next.status = "defeat";
        return next;
      });
    }
  };

  // 2. ENEMY AI (Chases closest player, runs only for Host or Solo)
  useEffect(() => {
    if ((sessionId && !isHost) || !session || !session.enemy || session.status !== "active") return;
    
    const aiInterval = setInterval(() => {
      let target = session.host;
      let targetKey = "host";

      // Find closest player in Co-op
      const hostDist = Math.hypot(session.enemy.x - session.host.x, session.enemy.y - session.host.y);
      if (session.guest && session.guest.hp > 0) {
        const guestDist = Math.hypot(session.enemy.x - session.guest.x, session.enemy.y - session.guest.y);
        if (guestDist < hostDist || session.host.hp <= 0) {
          target = session.guest;
          targetKey = "guest";
        }
      }

      if (target.hp <= 0) return;

      let newHp = target.hp;
      const currentDist = Math.hypot(session.enemy.x - target.x, session.enemy.y - target.y);

      // Attack if close enough
      if (currentDist < 80) newHp -= session.enemy.attack; 

      // Move Boss towards target
      const angle = Math.atan2(target.y - session.enemy.y, target.x - session.enemy.x);
      const moveDist = 60; // Boss speed
      const newX = session.enemy.x + Math.cos(angle) * moveDist;
      const newY = session.enemy.y + Math.sin(angle) * moveDist;

      updateGame({
        "enemy.x": newX,
        "enemy.y": newY,
        [`${targetKey}.hp`]: newHp
      });

      if (newHp <= 0 && (!sessionId || session.host.hp <= 0)) {
        if (!sessionId) onCombatEnd({ victory: false });
      }
    }, 1200);

    return () => clearInterval(aiInterval);
  }, [isHost, session, sessionId, onCombatEnd]);

  // 3. COOLDOWN TICKER
  useEffect(() => {
    const ticker = setInterval(() => {
      setCooldowns(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => { next[k] = Math.max(0, next[k] - 1); });
        return next;
      });
      setMyMana(m => Math.min(character.max_mana, m + 5)); 
    }, 1000);
    return () => clearInterval(ticker);
  }, [character.max_mana]);

  // 4. CLICK TO MOVE
  const handleMapClick = (e) => {
    if (!session || session.status !== "active") return;
    const myPlayer = (!sessionId || isHost) ? session.host : session.guest;
    if (myPlayer.hp <= 0) return;

    const rect = arenaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const playerKey = (!sessionId || isHost) ? "host" : "guest";
    updateGame({ [`${playerKey}.x`]: x, [`${playerKey}.y`]: y });
  };

  // 5. ATTACK (Checks distance and cooldowns)
  const handleAttack = (ability) => {
    if (!session || !session.enemy) return;
    if (cooldowns[ability.id] > 0 || myMana < ability.mana_cost) return;

    const myData = (!sessionId || isHost) ? session.host : session.guest;
    if (myData.hp <= 0) return;

    const dist = Math.hypot(session.enemy.x - myData.x, session.enemy.y - myData.y);
    const isRanged = character.class_type === "mage" || character.class_type === "healer";
    const requiredRange = isRanged ? 300 : 90;
    
    if (dist > requiredRange) {
      setCombatLogs(prev => [`Target out of range! Move closer.`, ...prev].slice(0, 4));
      return;
    }

    setMyMana(m => m - ability.mana_cost);
    setCooldowns(prev => ({ ...prev, [ability.id]: ability.cooldown || 3 }));

    const boosted = applySkillTreeBonuses(character, character.class_type, character.skill_tree);
    const damage = Math.floor(boosted.attack * (ability.damage_mult || 1));
    
    setCombatLogs(prev => [`You hit ${session.enemy.name} for ${damage}!`, ...prev].slice(0, 4));
    
    const newEnemyHp = session.enemy.hp - damage;
    updateGame({ "enemy.hp": newEnemyHp });

    if (!sessionId && newEnemyHp <= 0) {
      onCombatEnd({ victory: true, totalDamage: damage });
    }
  };

  if (!session) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto w-10 h-10" /></div>;

  const myAbilities = CLASSES[character.class_type]?.abilities || [];
  const me = (!sessionId || isHost) ? session.host : session.guest;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto flex flex-col h-[85vh] select-none">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="font-heading font-bold text-xl text-primary flex items-center gap-2">
            <Swords /> {sessionId ? `Co-op Arena (Code: ${session.code})` : "Solo Combat Arena"}
          </h2>
          <p className="text-xs text-muted-foreground">Click map to move. Target must be in range to cast abilities.</p>
        </div>
        <Button onClick={onFlee} variant="destructive" size="sm"><ArrowLeft className="w-4 h-4 mr-2" /> Flee</Button>
      </div>

      {/* 2D BATTLE ARENA */}
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
        {/* Host Token */}
        {session.host && session.host.hp > 0 && (
          <motion.div 
            animate={{ left: session.host.x, top: session.host.y }}
            transition={{ duration: 0.6, ease: "linear" }}
            className="absolute w-12 h-12 -ml-6 -mt-6 bg-blue-600 rounded-full border-2 border-blue-300 flex items-center justify-center text-xl z-20 shadow-[0_0_15px_rgba(37,99,235,0.6)]"
          >
            {CLASSES[session.host.class || character.class_type]?.icon || "👤"}
            <div className="absolute -bottom-4 w-12 h-1.5 bg-red-950 rounded"><div className="h-full bg-green-500" style={{width:`${(session.host.hp/session.host.max_hp)*100}%`}}></div></div>
            <div className="absolute -top-5 text-[10px] font-bold text-white bg-black/50 px-1 rounded">{session.host.name}</div>
          </motion.div>
        )}

        {/* Guest Token */}
        {session.guest && session.guest.hp > 0 && (
          <motion.div 
            animate={{ left: session.guest.x, top: session.guest.y }}
            transition={{ duration: 0.6, ease: "linear" }}
            className="absolute w-12 h-12 -ml-6 -mt-6 bg-emerald-600 rounded-full border-2 border-emerald-300 flex items-center justify-center text-xl z-20 shadow-[0_0_15px_rgba(16,185,129,0.6)]"
          >
            {CLASSES[session.guest.class]?.icon || "👤"}
            <div className="absolute -bottom-4 w-12 h-1.5 bg-red-950 rounded"><div className="h-full bg-green-500" style={{width:`${(session.guest.hp/session.guest.max_hp)*100}%`}}></div></div>
            <div className="absolute -top-5 text-[10px] font-bold text-white bg-black/50 px-1 rounded">{session.guest.name}</div>
          </motion.div>
        )}

        {/* Boss Token */}
        {session.enemy && session.enemy.hp > 0 && (
          <motion.div 
            animate={{ left: session.enemy.x, top: session.enemy.y }}
            transition={{ duration: 1.2, ease: "linear" }}
            className="absolute w-24 h-24 -ml-12 -mt-12 bg-red-950 rounded-xl border-4 border-red-500 flex items-center justify-center text-5xl z-10 shadow-[0_0_30px_rgba(239,68,68,0.5)]"
          >
            {session.enemy.icon || "😈"}
            <div className="absolute -bottom-5 w-24 h-2.5 bg-slate-900 rounded border border-border"><div className="h-full bg-red-500" style={{width:`${(session.enemy.hp/session.enemy.max_hp)*100}%`}}></div></div>
            <div className="absolute -top-6 text-xs font-bold text-red-400 font-heading uppercase">{session.enemy.name}</div>
          </motion.div>
        )}
      </div>

      {/* COMBAT LOGS */}
      <div className="h-16 mt-3 bg-card rounded-lg border border-border/50 p-2 overflow-hidden text-xs text-muted-foreground flex flex-col justify-end">
        {combatLogs.map((log, i) => <div key={i} className="animate-in fade-in slide-in-from-bottom-2">{log}</div>)}
      </div>

      {/* HUD & ABILITIES */}
      <div className="mt-3 flex gap-3 h-20">
        <div className="w-32 bg-card border border-border/50 rounded-xl p-3 flex flex-col justify-center">
          <div className="text-xs font-bold mb-1 truncate">{character.name}</div>
          <div className="flex items-center gap-1 text-xs text-red-400 mb-1"><Heart className="w-3 h-3" /> {Math.max(0, me?.hp || 0)}</div>
          <div className="flex items-center gap-1 text-xs text-blue-400"><Zap className="w-3 h-3" /> {myMana}</div>
        </div>

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
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-lg font-bold text-white z-10">{cooldowns[ability.id]}s</div>
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