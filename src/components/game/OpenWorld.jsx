import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CLASSES, applySkillTreeBonuses, ZONES } from "@/lib/gameData";
import { Button } from "@/components/ui/button";
import { Users, Copy } from "lucide-react";
import { base44 } from "@/api/base44Client";

const MAP_SIZE = 2500;

export default function OpenWorld({ 
  character, sessionId, isHost, onEnemyDefeated, 
  onGenerateQuest, onAdvanceStory, spawnEnemyLLM, isGenerating,
  onOpenCoopLobby, onLeaveCoop
}) {
  const zone = ZONES[character.current_zone] || ZONES.whispering_woods;
  const cls = CLASSES[character.class_type];

  // Local State
  const [player, setPlayer] = useState({ x: MAP_SIZE/2, y: MAP_SIZE/2, tx: MAP_SIZE/2, ty: MAP_SIZE/2, hp: character.current_hp, maxHp: character.max_hp });
  const [mana, setMana] = useState(character.current_mana);
  const [partner, setPartner] = useState(null);
  const [enemies, setEnemies] = useState([]);
  const [target, setTarget] = useState(null);
  const [cooldowns, setCooldowns] = useState({});
  const [logs, setLogs] = useState(["Welcome to the Realm of Echoes."]);
  const [roomCode, setRoomCode] = useState("");
  
  // FIX: Stores the NPC we clicked on until we are close enough to talk
  const [pendingInteraction, setPendingInteraction] = useState(null);

  const mapRef = useRef(null);

  // Static NPCs
  const npcs = [
    { id: "story", name: "Elder Lumina", type: "Story", x: MAP_SIZE/2 - 100, y: MAP_SIZE/2 - 100, icon: "🧙‍♀️", color: "text-blue-400", action: onAdvanceStory },
    { id: "quest", name: "Bounty Board", type: "Quests", x: MAP_SIZE/2 + 100, y: MAP_SIZE/2 - 50, icon: "📜", color: "text-amber-400", action: onGenerateQuest },
  ];

  const addLog = (msg) => setLogs(p => [msg, ...p].slice(0, 5));

  // --- GAME LOOP (Movement & Enemy Spawning) ---
  useEffect(() => {
    const loop = setInterval(() => {
      // 1. Move Player
      setPlayer(p => {
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        const dist = Math.hypot(dx, dy);
        const speed = 12; // Move speed
        
        if (dist <= speed) return { ...p, x: p.tx, y: p.ty };
        return { ...p, x: p.x + (dx/dist)*speed, y: p.y + (dy/dist)*speed };
      });

      // 2. Cooldowns & Mana
      setCooldowns(c => {
        const next = { ...c };
        Object.keys(next).forEach(k => next[k] = Math.max(0, next[k] - 100));
        return next;
      });
      setMana(m => Math.min(character.max_mana, m + 1));

      // 3. Enemy AI
      setEnemies(ens => ens.map(e => {
        if (e.hp <= 0) return e;
        const distToPlayer = Math.hypot(e.x - player.x, e.y - player.y);
        if (distToPlayer < 300 && distToPlayer > 60) {
          const angle = Math.atan2(player.y - e.y, player.x - e.x);
          return { ...e, x: e.x + Math.cos(angle)*4, y: e.y + Math.sin(angle)*4 };
        }
        return e;
      }));
    }, 100);
    return () => clearInterval(loop);
  }, [player.tx, player.ty, character.max_mana]);

  // --- AUTO-TALK WHEN IN RANGE ---
  useEffect(() => {
    if (pendingInteraction) {
      const dist = Math.hypot(pendingInteraction.x - player.x, pendingInteraction.y - player.y);
      if (dist <= 150) {
        addLog(`Talking to ${pendingInteraction.name}...`);
        pendingInteraction.action();
        setPendingInteraction(null); // Clear the interaction so it doesn't loop
        setPlayer(p => ({ ...p, tx: p.x, ty: p.y })); // Stop walking immediately
      }
    }
  }, [player.x, player.y, pendingInteraction]);

  // --- SPAWN ENEMIES ---
  useEffect(() => {
    if (sessionId && !isHost) return;
    const spawnInterval = setInterval(async () => {
      if (enemies.length < 4) {
        const enemyData = await spawnEnemyLLM();
        if (enemyData) {
          setEnemies(prev => [...prev, {
            ...enemyData, id: Math.random().toString(),
            x: player.x + (Math.random() > 0.5 ? 400 : -400),
            y: player.y + (Math.random() > 0.5 ? 400 : -400),
            maxHp: enemyData.hp
          }]);
          addLog(`A wild ${enemyData.name} appears!`);
        }
      }
    }, 15000); 
    return () => clearInterval(spawnInterval);
  }, [isHost, sessionId, enemies.length, player.x, player.y]);

  // --- MULTIPLAYER SYNC ---
  useEffect(() => {
    if (!sessionId) {
      setPartner(null);
      setRoomCode("");
      return;
    }
    const syncInterval = setInterval(() => {
      const key = isHost ? "host" : "guest";
      base44.entities.CoopSession.update(sessionId, { [`${key}_pos`]: { x: player.x, y: player.y, hp: player.hp } });
    }, 500);

    const unsub = base44.entities.CoopSession.listen(sessionId, (data) => {
      // FIX: If data is null, the host deleted the room! Kick the guest safely.
      if (!data) {
        addLog("Room was closed by host.");
        onLeaveCoop();
        return;
      }

      if (data.code) setRoomCode(data.code);
      if (isHost && data.guest && data.guest_pos) setPartner({ ...data.guest, ...data.guest_pos });
      if (!isHost && data.host && data.host_pos) setPartner({ ...data.host, ...data.host_pos });
    });
    return () => { clearInterval(syncInterval); unsub(); };
  }, [sessionId, isHost, player.x, player.y, player.hp]);

  // --- INTERACTIONS ---
  const handleMapClick = (e) => {
    if (!mapRef.current || e.target.closest("button") || e.target.closest(".no-move")) return;
    const clickX = e.clientX - window.innerWidth / 2;
    const clickY = e.clientY - window.innerHeight / 2;
    setPlayer(p => ({ ...p, tx: p.x + clickX, ty: p.y + clickY }));
    setTarget(null);
    setPendingInteraction(null); // Cancel talking if user clicks away
  };

  const interactWithNPC = (npc) => {
    if (isGenerating) return addLog("Please wait... generating AI dialogue.");
    
    const dist = Math.hypot(npc.x - player.x, npc.y - player.y);
    if (dist > 150) {
      addLog(`Walking to ${npc.name}...`);
      setPlayer(p => ({ ...p, tx: npc.x, ty: npc.y + 60 }));
      setPendingInteraction(npc); // Queue it up to trigger when close enough
    } else {
      addLog(`Talking to ${npc.name}...`);
      npc.action();
    }
  };

  const useAbility = (ability) => {
    if (!target) return addLog("No target selected!");
    if (cooldowns[ability.id] > 0) return addLog("Ability on cooldown.");
    if (mana < ability.mana_cost) return addLog("Not enough mana.");

    const dist = Math.hypot(target.x - player.x, target.y - player.y);
    const range = ability.type === "heal" ? 1000 : 150;
    if (dist > range) return addLog("Target out of range.");

    setMana(m => m - ability.mana_cost);
    setCooldowns(c => ({ ...c, [ability.id]: (ability.cooldown || 3) * 1000 }));

    if (ability.type === "damage") {
      const boosted = applySkillTreeBonuses(character, character.class_type, character.skill_tree);
      const dmg = Math.floor(boosted.attack * (ability.damage_mult || 1));
      
      setEnemies(prev => prev.map(e => {
        if (e.id === target.id) {
          const newHp = e.hp - dmg;
          addLog(`You hit ${e.name} for ${dmg}!`);
          if (newHp <= 0) {
            addLog(`${e.name} defeated!`);
            onEnemyDefeated(e, dmg);
            setTarget(null);
          }
          return { ...e, hp: newHp };
        }
        return e;
      }));
    } else if (ability.type === "heal") {
      const heal = Math.floor(character.max_hp * (ability.heal_percent || 0.3));
      setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + heal) }));
      addLog(`You healed for ${heal} HP.`);
    }
  };

  // --- KEYBOARD BINDINGS (1-5) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const abilities = cls?.abilities.slice(0, 5) || [];
      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const index = parseInt(e.key) - 1;
        if (abilities[index]) useAbility(abilities[index]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [target, cooldowns, mana, player, enemies]);

  const cameraX = window.innerWidth / 2 - player.x;
  const cameraY = window.innerHeight / 2 - player.y;

  return (
    <div className="fixed inset-0 bg-slate-950 overflow-hidden text-foreground select-none" onClick={handleMapClick}>
      {/* WORLD MAP LAYER */}
      <motion.div 
        ref={mapRef}
        className="absolute w-[2500px] h-[2500px]"
        animate={{ x: cameraX, y: cameraY }}
        transition={{ type: "tween", ease: "linear", duration: 0.1 }}
        style={{ 
          backgroundImage: `radial-gradient(circle at center, transparent 0%, #020617 100%), 
                            repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(255,255,255,0.03) 50px),
                            repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(255,255,255,0.03) 50px)`,
          backgroundColor: '#0f172a'
        }}
      >
        {/* NPCs */}
        {npcs.map(npc => (
          <div 
            key={npc.id} 
            className="absolute -ml-8 -mt-8 w-16 h-16 flex flex-col items-center justify-center cursor-pointer hover:scale-110 transition-transform no-move"
            style={{ left: npc.x, top: npc.y }}
            onClick={(e) => { e.stopPropagation(); interactWithNPC(npc); }}
          >
            <div className={`text-4xl ${isGenerating ? 'animate-pulse' : 'animate-bounce'}`}>{npc.icon}</div>
            <div className="bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold mt-1 text-center border border-border/50">
              <div className={npc.color}>{npc.name}</div>
              <div className="text-muted-foreground">{npc.type}</div>
            </div>
          </div>
        ))}

        {/* Enemies */}
        {enemies.filter(e => e.hp > 0).map(enemy => (
          <div 
            key={enemy.id} 
            className={`absolute -ml-10 -mt-10 w-20 h-20 flex flex-col items-center justify-center cursor-crosshair transition-all no-move ${target?.id === enemy.id ? 'scale-110 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]' : ''}`}
            style={{ left: enemy.x, top: enemy.y }}
            onClick={(e) => { e.stopPropagation(); setTarget(enemy); }}
          >
            <div className="text-5xl drop-shadow-xl">{enemy.icon}</div>
            <div className="bg-black/80 px-2 py-0.5 rounded text-xs font-bold mt-2 border border-red-900/50 whitespace-nowrap text-red-400">
              {enemy.name} <span className="text-muted-foreground">Lv.{enemy.level}</span>
            </div>
            <div className="w-16 h-1.5 bg-red-950 mt-1 rounded-full overflow-hidden border border-red-900">
              <div className="h-full bg-red-500" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }} />
            </div>
          </div>
        ))}

        {/* Co-op Partner */}
        {partner && (
          <div className="absolute -ml-6 -mt-6 w-12 h-12 flex flex-col items-center justify-center pointer-events-none transition-all duration-500" style={{ left: partner.x, top: partner.y }}>
            <div className="text-3xl drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">{CLASSES[partner.class]?.icon || "👤"}</div>
            <div className="bg-emerald-950/80 px-2 py-0.5 rounded text-[10px] font-bold mt-1 text-emerald-400">{partner.name}</div>
          </div>
        )}

        {/* MY PLAYER */}
        <div className="absolute -ml-6 -mt-6 w-12 h-12 flex flex-col items-center justify-center pointer-events-none z-50" style={{ left: player.x, top: player.y }}>
          <div className="text-3xl drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]">{cls?.icon}</div>
          <div className="bg-blue-950/80 px-2 py-0.5 rounded text-[10px] font-bold mt-1 text-blue-400">{character.name}</div>
        </div>
        
        {/* Click Target Indicator */}
        {player.x !== player.tx && (
          <motion.div 
            className="absolute -ml-2 -mt-2 w-4 h-4 rounded-full border-2 border-primary pointer-events-none"
            style={{ left: player.tx, top: player.ty }}
            animate={{ scale: [1, 2], opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          />
        )}
      </motion.div>

      {/* OVERLAY: Zone & Multiplayer Info */}
      <div className="absolute top-20 right-4 flex flex-col gap-2 items-end z-40 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md border border-border/50 rounded-xl p-3 text-right">
          <div className="text-primary font-heading font-bold text-lg">{zone.name}</div>
          <div className="text-xs text-muted-foreground">Level {zone.level_range[0]}-{zone.level_range[1]}</div>
        </div>
        
        <div className="pointer-events-auto">
           {sessionId ? (
              <div className="bg-black/60 border border-green-500/50 rounded-xl p-3 flex flex-col items-end min-w-[160px]">
                 <div className="text-xs text-green-400 font-bold flex items-center gap-1">
                   <Users className="w-3 h-3"/> Co-op Active
                 </div>
                 
                 <div 
                   className="mt-2 flex items-center justify-between gap-2 w-full bg-black/50 px-2 py-1.5 rounded border border-border cursor-pointer hover:bg-black/70 transition-colors no-move"
                   onClick={(e) => {
                     e.stopPropagation();
                     navigator.clipboard.writeText(roomCode);
                     addLog("Room code copied to clipboard!");
                   }}
                 >
                   <span className="text-[10px] font-mono text-muted-foreground truncate w-16 text-center font-bold text-white tracking-widest">
                     {roomCode || "..."}
                   </span>
                   <Copy className="w-3 h-3 text-muted-foreground" />
                 </div>

                 <div className="text-sm text-white mt-2 font-semibold text-right">
                   {partner ? partner.name : "Waiting for partner..."}
                 </div>
                 <Button size="sm" variant="ghost" onClick={onLeaveCoop} className="h-6 mt-2 w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30">Leave Room</Button>
              </div>
           ) : (
              <Button variant="outline" size="sm" onClick={onOpenCoopLobby} className="bg-black/60 border-primary/50 text-primary hover:bg-primary/20">
                <Users className="w-4 h-4 mr-2" /> Multiplayer
              </Button>
           )}
        </div>
      </div>

      {/* OVERLAY: Combat Logs */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-64 flex flex-col gap-1 pointer-events-none">
        {logs.map((log, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-xs font-semibold bg-black/50 text-white px-2 py-1 rounded w-fit border border-white/10 backdrop-blur-sm">
            {log}
          </motion.div>
        ))}
      </div>

      {/* OVERLAY: Action Bar (Bottom Center) */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-3 shadow-2xl flex flex-col items-center no-move z-40">
        
        {target && (
          <div className="w-full mb-3 px-3 py-1.5 bg-red-950/30 border border-red-900/50 rounded-lg flex justify-between items-center">
            <span className="text-xs font-bold text-red-400">🎯 {target.name}</span>
            <span className="text-xs text-red-200">{target.hp}/{target.maxHp} HP</span>
          </div>
        )}

        <div className="flex gap-2">
          {cls?.abilities.slice(0, 5).map((ability, idx) => {
            const isReady = (cooldowns[ability.id] || 0) === 0 && mana >= ability.mana_cost;
            return (
              <Button 
                key={ability.id} 
                onClick={() => useAbility(ability)}
                variant="outline" 
                className={`w-14 h-14 relative flex flex-col p-1 border-2 ${isReady ? 'border-primary/50 hover:bg-primary/20 hover:border-primary' : 'border-border/30 opacity-50 cursor-not-allowed'}`}
              >
                {cooldowns[ability.id] > 0 && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-sm font-bold text-white z-10">
                    {Math.ceil(cooldowns[ability.id]/1000)}s
                  </div>
                )}
                <span className="text-xs font-heading font-bold truncate w-full mt-1">{ability.name}</span>
                <span className="text-[9px] text-blue-400 mt-auto">{ability.mana_cost} MP</span>
                <div className="absolute -top-2 -right-2 bg-background border rounded-md px-1.5 py-0.5 text-[9px] text-muted-foreground">{idx + 1}</div>
              </Button>
            );
          })}
        </div>
        <div className="flex w-full justify-between mt-2 px-1 gap-4">
          <div className="flex-1 h-2 bg-red-950 rounded-full border border-border overflow-hidden"><div className="h-full bg-red-500" style={{width:`${(player.hp/player.maxHp)*100}%`}}/></div>
          <div className="flex-1 h-2 bg-blue-950 rounded-full border border-border overflow-hidden"><div className="h-full bg-blue-500" style={{width:`${(mana/character.max_mana)*100}%`}}/></div>
        </div>
      </div>
    </div>
  );
}