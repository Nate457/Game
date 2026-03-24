import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CLASSES, applySkillTreeBonuses } from "@/lib/gameData";
import { Heart, Zap, Skull, Swords, Trophy, ArrowLeft } from "lucide-react";

function CombatLog({ logs }) {
  const bottomRef = useRef(null);
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="bg-muted/30 rounded-lg border border-border/30 p-3 h-32 overflow-y-auto">
      {logs.map((log, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`text-xs mb-1 ${
            log.type === "player_damage" ? "text-orange-400" :
            log.type === "enemy_damage" ? "text-red-400" :
            log.type === "heal" ? "text-green-400" :
            log.type === "buff" ? "text-blue-400" :
            log.type === "dot" ? "text-purple-400" :
            log.type === "dodge" ? "text-cyan-400" :
            log.type === "crit" ? "text-primary font-bold" :
            log.type === "victory" ? "text-primary font-bold" :
            log.type === "defeat" ? "text-destructive font-bold" :
            "text-muted-foreground"
          }`}
        >
          {log.text}
        </motion.div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

export default function CombatView({ character, enemy, onCombatEnd, onFlee }) {
  const boosted = applySkillTreeBonuses(
    { attack: character.attack, defense: character.defense, max_hp: character.max_hp, max_mana: character.max_mana, speed: character.speed || 10, crit_chance: character.crit_chance || 5 },
    character.class_type, character.skill_tree
  );

  const [playerHp, setPlayerHp] = useState(character.current_hp);
  const [playerMana, setPlayerMana] = useState(character.current_mana);
  const [enemyHp, setEnemyHp] = useState(enemy.hp);
  const [logs, setLogs] = useState([
    { text: `⚔️ ${enemy.name} appears!`, type: "info" },
    { text: `"${enemy.battle_cry || 'You shall fall!'}"`, type: "info" },
  ]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [combatOver, setCombatOver] = useState(false);
  const [buffs, setBuffs] = useState([]);
  const [enemyDebuffs, setEnemyDebuffs] = useState([]);
  const [dotEffects, setDotEffects] = useState([]);
  const [shakeEnemy, setShakeEnemy] = useState(false);
  const [shakePlayer, setShakePlayer] = useState(false);
  const [hasRevivedOnce, setHasRevivedOnce] = useState(false);
  const totalDamageRef = useRef(0);

  const cls = CLASSES[character.class_type];

  const getEffectiveAttack = () => {
    let atk = boosted.attack;
    buffs.forEach(b => { if (b.stat === "attack") atk = Math.floor(atk * b.mult); });
    return atk;
  };

  const getEffectiveDefense = () => {
    let def = boosted.defense;
    buffs.forEach(b => { if (b.stat === "defense") def = Math.floor(def * b.mult); });
    return def;
  };

  const getEnemyEffectiveAttack = () => {
    let atk = enemy.attack;
    enemyDebuffs.forEach(d => { if (d.stat === "attack") atk = Math.floor(atk * d.mult); });
    return atk;
  };

  const addLog = (text, type) => setLogs(prev => [...prev, { text, type }]);

  const rollCrit = () => {
    const critChance = boosted.crit_chance || 5;
    return Math.random() * 100 < critChance;
  };

  const rollDodge = () => {
    const dodge = boosted.dodge_chance || 0;
    return Math.random() < dodge;
  };

  const rollDoubleHit = () => {
    const dhChance = boosted.double_hit_chance || 0;
    return Math.random() < dhChance;
  };

  const calcPlayerDamage = (ability, forceFirst) => {
    const atk = getEffectiveAttack();
    let dmg = Math.max(1, Math.floor(atk * ability.damage_mult) - Math.floor(enemy.defense * 0.3) + Math.floor(Math.random() * 6));
    const globalMult = boosted.damage_mult_global || 1;
    dmg = Math.floor(dmg * globalMult);
    const isCrit = ability.crit_force || rollCrit();
    if (isCrit) {
      const critMult = 1.5 + (boosted.crit_damage_mult ? boosted.crit_damage_mult - 1 : 0);
      dmg = Math.floor(dmg * critMult);
    }
    return { dmg, isCrit };
  };

  const enemyTurn = (currentPlayerHp, currentPlayerMana, currentEnemyHp) => {
    setTimeout(() => {
      // Apply DoT effects to enemy
      let newEHp = currentEnemyHp;
      dotEffects.forEach(dot => {
        if (dot.turns > 0) {
          newEHp = Math.max(0, newEHp - dot.damage);
          addLog(`${enemy.name} takes ${dot.damage} poison damage!`, "dot");
          if (newEHp <= 0) {
            addLog(`${enemy.name} succumbs to poison! Victory!`, "victory");
            setCombatOver(true);
            setTimeout(() => onCombatEnd({ victory: true, playerHp: currentPlayerHp, playerMana: currentPlayerMana, totalDamage: totalDamageRef.current }), 1500);
            return;
          }
        }
      });
      setDotEffects(prev => prev.map(d => ({ ...d, turns: d.turns - 1 })).filter(d => d.turns > 0));
      setEnemyHp(newEHp);

      if (newEHp <= 0) return;

      // Passive regen
      let regenHp = currentPlayerHp;
      const regenPct = boosted.passive_regen_percent || 0;
      if (regenPct > 0) {
        const regenAmt = Math.floor(character.max_hp * regenPct);
        regenHp = Math.min(character.max_hp, currentPlayerHp + regenAmt);
        setPlayerHp(regenHp);
        addLog(`You regenerate ${regenAmt} HP.`, "heal");
      }

      // Enemy attack
      const eDmg = Math.max(1, Math.floor(getEnemyEffectiveAttack() * (0.8 + Math.random() * 0.4)) - Math.floor(getEffectiveDefense() * 0.5));

      // Dodge?
      if (rollDodge()) {
        addLog(`You dodge ${enemy.name}'s attack!`, "dodge");
        setBuffs(prev => prev.map(b => ({ ...b, turns: b.turns - 1 })).filter(b => b.turns > 0));
        setEnemyDebuffs(prev => prev.map(d => ({ ...d, turns: d.turns - 1 })).filter(d => d.turns > 0));
        setIsPlayerTurn(true);
        return;
      }

      // Reflect damage
      const reflectPct = boosted.reflect_damage || 0;
      let newHp = Math.max(0, regenHp - eDmg);

      if (reflectPct > 0) {
        const reflected = Math.floor(eDmg * reflectPct);
        const newEhp2 = Math.max(0, newEHp - reflected);
        setEnemyHp(newEhp2);
        addLog(`You reflect ${reflected} damage back!`, "player_damage");
        if (newEhp2 <= 0) {
          setPlayerHp(newHp);
          addLog(`${enemy.name} is destroyed by reflected damage! Victory!`, "victory");
          setCombatOver(true);
          setTimeout(() => onCombatEnd({ victory: true, playerHp: newHp, playerMana: currentPlayerMana, totalDamage: totalDamageRef.current }), 1500);
          return;
        }
      }

      setPlayerHp(newHp);
      setShakePlayer(true);
      setTimeout(() => setShakePlayer(false), 300);
      addLog(`${enemy.name} attacks for ${eDmg} damage!`, "enemy_damage");

      // Tick buffs
      setBuffs(prev => prev.map(b => ({ ...b, turns: b.turns - 1 })).filter(b => b.turns > 0));
      setEnemyDebuffs(prev => prev.map(d => ({ ...d, turns: d.turns - 1 })).filter(d => d.turns > 0));

      if (newHp <= 0) {
        // Check revive
        if (boosted.combat_revive_once && !hasRevivedOnce) {
          setHasRevivedOnce(true);
          setPlayerHp(1);
          addLog(`✦ Divine intervention! You survive with 1 HP!`, "buff");
          setIsPlayerTurn(true);
          return;
        }
        addLog(`You have been defeated by ${enemy.name}...`, "defeat");
        setCombatOver(true);
        setTimeout(() => onCombatEnd({ victory: false, playerHp: 0, playerMana: currentPlayerMana, totalDamage: totalDamageRef.current }), 1500);
      } else {
        setIsPlayerTurn(true);
      }
    }, 800);
  };

  const useAbility = (ability) => {
    if (combatOver || !isPlayerTurn) return;
    const manaCostReduction = boosted.mana_cost_reduction || 0;
    const effectiveCost = Math.max(0, Math.round(ability.mana_cost * (1 - manaCostReduction)));
    if (effectiveCost > playerMana) {
      addLog("Not enough mana!", "info");
      return;
    }

    setIsPlayerTurn(false);
    const newMana = playerMana - effectiveCost;
    setPlayerMana(newMana);

    if (ability.type === "damage") {
      const { dmg, isCrit } = calcPlayerDamage(ability);
      const newEHp = Math.max(0, enemyHp - dmg);
      setEnemyHp(newEHp);
      setShakeEnemy(true);
      setTimeout(() => setShakeEnemy(false), 300);
      totalDamageRef.current += dmg;
      addLog(`${isCrit ? "⚡CRIT! " : ""}${ability.name} hits for ${dmg} damage!`, isCrit ? "crit" : "player_damage");

      // DoT
      if (ability.dot) {
        const dotDmg = ability.dot.damage + (boosted.dot_bonus || 0);
        setDotEffects(prev => [...prev, { damage: dotDmg, turns: ability.dot.turns }]);
        addLog(`Poison applied! ${dotDmg}/turn for ${ability.dot.turns} turns.`, "dot");
      }

      // Debuff on enemy
      if (ability.debuff) setEnemyDebuffs(prev => [...prev, ability.debuff]);

      if (newEHp <= 0) {
        addLog(`${enemy.name} has been slain!`, "victory");
        setCombatOver(true);
        setTimeout(() => onCombatEnd({ victory: true, playerHp: playerHp, playerMana: newMana, totalDamage: totalDamageRef.current }), 1500);
        return;
      }

      // Double hit?
      if (rollDoubleHit()) {
        const { dmg: dmg2 } = calcPlayerDamage(ability);
        const newEHp2 = Math.max(0, newEHp - dmg2);
        setEnemyHp(newEHp2);
        totalDamageRef.current += dmg2;
        addLog(`⚡ Double strike! +${dmg2} bonus damage!`, "crit");
        if (newEHp2 <= 0) {
          addLog(`${enemy.name} falls to your second strike!`, "victory");
          setCombatOver(true);
          setTimeout(() => onCombatEnd({ victory: true, playerHp: playerHp, playerMana: newMana, totalDamage: totalDamageRef.current }), 1500);
          return;
        }
      }

      enemyTurn(playerHp, newMana, newEHp);

    } else if (ability.type === "heal") {
      const healAmt = Math.floor(character.max_hp * ability.heal_percent * (1 + (boosted.heal_bonus_percent || 0)));
      const newHp = Math.min(character.max_hp, playerHp + healAmt);
      setPlayerHp(newHp);
      addLog(`You heal for ${healAmt} HP!`, "heal");
      enemyTurn(newHp, newMana, enemyHp);

    } else if (ability.type === "heal_mana") {
      const healMana = Math.min(character.max_mana, playerMana + ability.heal_mana_flat + effectiveCost);
      setPlayerMana(healMana);
      if (ability.buff) setBuffs(prev => [...prev, ability.buff]);
      addLog(`Mana Surge! Restored mana and boosted power.`, "buff");
      enemyTurn(playerHp, healMana, enemyHp);

    } else if (ability.type === "hot") {
      const hotEffect = {
        damage: 0,
        heal_amount: Math.floor(character.max_hp * ability.heal_percent_per_turn * (1 + (boosted.heal_bonus_percent || 0))),
        turns: ability.turns,
        isHot: true,
      };
      setDotEffects(prev => [...prev, hotEffect]);
      addLog(`Mending Aura! Healing ${hotEffect.heal_amount}/turn for ${ability.turns} turns.`, "heal");
      enemyTurn(playerHp, newMana, enemyHp);

    } else if (ability.type === "buff") {
      setBuffs(prev => [...prev, ability.buff]);
      if (ability.self_debuff) setBuffs(prev => [...prev, ability.self_debuff]);
      if (ability.crit_buff) {
        // Handled via temporary state — simplified as a log
      }
      addLog(`${ability.name} activated!`, "buff");
      enemyTurn(playerHp, newMana, enemyHp);

    } else if (ability.type === "debuff") {
      setEnemyDebuffs(prev => [...prev, ability.debuff]);
      addLog(`${ability.name}! ${enemy.name} is weakened.`, "buff");
      enemyTurn(playerHp, newMana, enemyHp);
    }
  };

  const playerHpPct = Math.max(0, (playerHp / character.max_hp) * 100);
  const enemyHpPct = Math.max(0, (enemyHp / enemy.hp) * 100);
  const manaPct = (playerMana / character.max_mana) * 100;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Arena */}
      <div className="bg-gradient-to-br from-secondary/50 via-card to-secondary/50 rounded-2xl border border-border/50 p-5 mb-4">
        <div className="flex items-center justify-between mb-5">
          <motion.div animate={shakePlayer ? { x: [-8, 8, -4, 4, 0] } : {}} transition={{ duration: 0.3 }} className="text-center flex-1">
            <div className="text-5xl mb-1">{cls?.icon}</div>
            <div className="font-heading text-xs font-bold">{character.name}</div>
            <div className="text-xs text-muted-foreground">Lv.{character.level}</div>
          </motion.div>

          <Swords className="w-7 h-7 text-primary/50 mx-3" />

          <motion.div animate={shakeEnemy ? { x: [-8, 8, -4, 4, 0] } : {}} transition={{ duration: 0.3 }} className="text-center flex-1">
            <div className="text-5xl mb-1">{enemy.icon}</div>
            <div className="font-heading text-xs font-bold text-destructive/90">{enemy.name}</div>
            <div className="text-xs text-muted-foreground">Lv.{enemy.level}</div>
          </motion.div>
        </div>

        {/* Bars */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-red-300">❤ {playerHp}/{character.max_hp}</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-red-700 to-red-400 rounded-full" animate={{ width: `${playerHpPct}%` }} transition={{ duration: 0.4 }} />
            </div>
            <div className="flex justify-between text-xs mt-1 mb-0.5">
              <span className="text-blue-300">⚡ {playerMana}/{character.max_mana}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-blue-700 to-blue-400 rounded-full" animate={{ width: `${manaPct}%` }} transition={{ duration: 0.4 }} />
            </div>
          </div>
          <div>
            <div className="flex justify-end text-xs mb-0.5">
              <span className="text-destructive/80">☠ {enemyHp}/{enemy.hp}</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-destructive to-red-500 rounded-full" animate={{ width: `${enemyHpPct}%` }} transition={{ duration: 0.4 }} />
            </div>
          </div>
        </div>

        {/* Status effects */}
        {(buffs.length > 0 || enemyDebuffs.length > 0 || dotEffects.length > 0) && (
          <div className="flex flex-wrap gap-1">
            {buffs.map((b, i) => (
              <span key={i} className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                {b.stat}↑ ({b.turns}t)
              </span>
            ))}
            {enemyDebuffs.map((d, i) => (
              <span key={i} className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                {enemy.name} {d.stat}↓ ({d.turns}t)
              </span>
            ))}
            {dotEffects.filter(d => !d.isHot).map((d, i) => (
              <span key={i} className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">
                ☠ {d.damage}/t ({d.turns}t)
              </span>
            ))}
            {dotEffects.filter(d => d.isHot).map((d, i) => (
              <span key={i} className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                💚 {d.heal_amount}/t ({d.turns}t)
              </span>
            ))}
          </div>
        )}
      </div>

      <CombatLog logs={logs} />

      {/* Abilities */}
      {!combatOver && (
        <div className="grid grid-cols-2 gap-2 mt-4">
          {cls?.abilities.map((ability) => {
            const manaCostReduction = boosted.mana_cost_reduction || 0;
            const effectiveCost = Math.max(0, Math.round(ability.mana_cost * (1 - manaCostReduction)));
            return (
              <Button
                key={ability.id}
                onClick={() => useAbility(ability)}
                disabled={!isPlayerTurn || effectiveCost > playerMana}
                variant="outline"
                className="h-auto py-2.5 px-3 flex flex-col items-start gap-0.5 border-border/50 hover:border-primary/50 hover:bg-primary/5 disabled:opacity-40"
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="font-heading text-xs font-semibold">{ability.name}</span>
                  {effectiveCost > 0 && (
                    <span className={`text-xs ml-auto ${effectiveCost < ability.mana_cost ? "text-green-400" : "text-blue-400"}`}>{effectiveCost} MP</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground text-left">{ability.description}</span>
              </Button>
            );
          })}
          <Button
            onClick={onFlee}
            disabled={!isPlayerTurn}
            variant="ghost"
            className="col-span-2 text-muted-foreground hover:text-destructive text-xs h-8"
          >
            <ArrowLeft className="w-3 h-3 mr-1" /> Flee (-10% HP)
          </Button>
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {combatOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 text-center p-5 rounded-xl border border-primary/30 bg-card/80"
          >
            {enemyHp <= 0 ? (
              <>
                <Trophy className="w-10 h-10 text-primary mx-auto mb-2" />
                <div className="font-heading text-xl text-primary font-bold">Victory!</div>
                <div className="text-sm text-muted-foreground mt-1">
                  +{enemy.xp_reward} XP • +{enemy.gold_reward} Gold
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{totalDamageRef.current} total damage dealt</div>
              </>
            ) : (
              <>
                <Skull className="w-10 h-10 text-destructive mx-auto mb-2" />
                <div className="font-heading text-xl text-destructive font-bold">Defeated</div>
                <div className="text-sm text-muted-foreground mt-1">Your hero falls...</div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}