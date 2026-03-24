import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CLASSES, applySkillTreeBonuses } from "@/lib/gameData";
import { MULTICLASS_SPECS, ABILITY_PRIMERS, PRIMER_TAGS, SOLO_COMBOS, COOP_COMBOS } from "@/lib/coopData";
import { applyAbility, calcComboDamage } from "@/lib/comboEngine";
import { Heart, Zap, Skull, Trophy, ArrowLeft, Flame, Zap as ZapIcon } from "lucide-react";

// ── Cooldown bar for an ability slot ─────────────────────────
function AbilityButton({ ability, cooldownLeft, maxCooldown, manaOk, onUse, isPlayerTurn }) {
  const pct = maxCooldown > 0 ? ((maxCooldown - cooldownLeft) / maxCooldown) * 100 : 100;
  const ready = cooldownLeft === 0 && manaOk && isPlayerTurn;
  return (
    <button
      onClick={onUse}
      disabled={!ready}
      className={`relative overflow-hidden rounded-xl border text-left p-2.5 transition-all duration-150 ${
        ready
          ? "border-primary/60 bg-primary/5 hover:bg-primary/15 cursor-pointer scale-100 hover:scale-105"
          : "border-border/30 bg-muted/20 opacity-50 cursor-not-allowed"
      }`}
    >
      {cooldownLeft > 0 && (
        <div
          className="absolute inset-0 bg-black/60 flex items-center justify-center z-10"
          style={{ clipPath: `inset(${pct}% 0 0 0)` }}
        >
          <span className="text-white font-bold text-sm">{cooldownLeft}s</span>
        </div>
      )}
      <div className="flex items-center justify-between mb-0.5">
        <span className="font-heading text-xs font-semibold truncate">{ability.name}</span>
        {ability.mana_cost > 0 && (
          <span className="text-xs text-blue-400 ml-1 flex-shrink-0">{ability.mana_cost}mp</span>
        )}
        {ability.cooldown && (
          <span className="text-xs text-muted-foreground ml-1 flex-shrink-0">{ability.cooldown}s</span>
        )}
      </div>
      <span className="text-xs text-muted-foreground leading-tight line-clamp-1">{ability.description}</span>
    </button>
  );
}

// ── Primer tag display ────────────────────────────────────────
function PrimerBadges({ primers, label }) {
  if (!primers?.length) return null;
  return (
    <div className="flex flex-wrap gap-1 items-center">
      {label && <span className="text-xs text-muted-foreground">{label}:</span>}
      {primers.map(p => {
        const tag = PRIMER_TAGS[p];
        if (!tag) return null;
        return (
          <motion.span
            key={p}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`text-xs px-1.5 py-0.5 rounded-full bg-muted/40 ${tag.color}`}
          >
            {tag.icon} {tag.label}
          </motion.span>
        );
      })}
    </div>
  );
}

// ── Combo flash overlay ───────────────────────────────────────
function ComboFlash({ combo, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br ${combo.color}/80 backdrop-blur-sm`}
    >
      <motion.div
        animate={{ scale: [1, 1.3, 1], rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.5, repeat: 2 }}
        className="text-5xl mb-2"
      >
        {combo.icon}
      </motion.div>
      <div className="font-heading text-2xl font-bold text-white drop-shadow-lg">{combo.name}</div>
      <div className="text-sm text-white/80 mt-1">{combo.effect}</div>
    </motion.div>
  );
}

// ── Combat log ────────────────────────────────────────────────
function CombatLog({ logs }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);
  const TYPE_COLORS = {
    player_damage: "text-orange-400", p2_damage: "text-yellow-400",
    enemy_damage: "text-red-400", heal: "text-green-400",
    buff: "text-blue-400", dot: "text-purple-400", dodge: "text-cyan-400",
    crit: "text-primary font-bold", combo: "text-primary font-bold text-sm",
    coop_combo: "text-yellow-300 font-bold text-sm",
    victory: "text-primary font-bold", defeat: "text-destructive font-bold",
    info: "text-muted-foreground",
  };
  return (
    <div className="bg-muted/30 rounded-lg border border-border/30 p-3 h-28 overflow-y-auto">
      {logs.map((log, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          className={`text-xs mb-0.5 ${TYPE_COLORS[log.type] || "text-muted-foreground"}`}>
          {log.text}
        </motion.div>
      ))}
      <div ref={ref} />
    </div>
  );
}

// ============================================================
// MAIN REAL-TIME COMBAT COMPONENT
// Props:
//   character   — P1 character object
//   p2          — P2 character object (null for solo)
//   enemy       — enemy object
//   onCombatEnd — callback({ victory, playerHp, playerMana, p2Hp, p2Mana, totalDamage, combosPerformed, coopCombosPerformed })
//   onFlee      — callback
// ============================================================
export default function RealTimeCombat({ character, p2, enemy, onCombatEnd, onFlee }) {
  const isCoopMode = !!p2;

  // ── Compute boosted stats ───────────────────────────────────
  const boosted = applySkillTreeBonuses(
    { attack: character.attack, defense: character.defense, max_hp: character.max_hp, max_mana: character.max_mana, speed: character.speed || 10, crit_chance: character.crit_chance || 5 },
    character.class_type, character.skill_tree
  );
  const boostedP2 = p2 ? applySkillTreeBonuses(
    { attack: p2.attack, defense: p2.defense, max_hp: p2.max_hp, max_mana: p2.max_mana, speed: p2.speed || 10, crit_chance: p2.crit_chance || 5 },
    p2.class_type, p2.skill_tree
  ) : null;

  // Apply multiclass spec passives
  const spec1 = character.multiclass_spec ? MULTICLASS_SPECS[character.multiclass_spec] : null;
  const spec2 = p2?.multiclass_spec ? MULTICLASS_SPECS[p2.multiclass_spec] : null;
  if (spec1?.passive) { Object.entries(spec1.passive).forEach(([k, v]) => { boosted[k] = (boosted[k] || 0) + v; }); }
  if (spec2?.passive && boostedP2) { Object.entries(spec2.passive).forEach(([k, v]) => { boostedP2[k] = (boostedP2[k] || 0) + v; }); }

  // ── HP / Mana state ─────────────────────────────────────────
  const [p1Hp, setP1Hp] = useState(character.current_hp);
  const [p1Mana, setP1Mana] = useState(character.current_mana);
  const [p2Hp, setP2Hp] = useState(p2?.current_hp || 0);
  const [p2Mana, setP2Mana] = useState(p2?.current_mana || 0);
  const [enemyHp, setEnemyHp] = useState(enemy.hp);
  const [enemyDebuffs, setEnemyDebuffs] = useState([]);
  const [dotEffects, setDotEffects] = useState([]);

  // ── Cooldown maps: { abilityId: remainingSeconds } ──────────
  const [p1Cooldowns, setP1Cooldowns] = useState({});
  const [p2Cooldowns, setP2Cooldowns] = useState({});

  // ── GCD (global cooldown) — 1.5s after any ability ──────────
  const [p1GCD, setP1GCD] = useState(0);
  const [p2GCD, setP2GCD] = useState(0);

  // ── Primer / Combo state ─────────────────────────────────────
  const [enemyPrimers, setEnemyPrimers] = useState([]);
  const [flashCombo, setFlashCombo] = useState(null);
  const [combosPerformed, setCombosPerformed] = useState(0);
  const [coopCombosPerformed, setCoopCombosPerformed] = useState(0);

  // ── Misc ─────────────────────────────────────────────────────
  const [logs, setLogs] = useState([
    { text: `⚔️ ${enemy.name} appears!`, type: "info" },
    { text: `"${enemy.battle_cry || 'Prepare to die!'}"`, type: "info" },
  ]);
  const [combatOver, setCombatOver] = useState(false);
  const [shakeEnemy, setShakeEnemy] = useState(false);
  const [shakeP1, setShakeP1] = useState(false);
  const [shakeP2, setShakeP2] = useState(false);
  const [hasRevived1, setHasRevived1] = useState(false);
  const [hasRevived2, setHasRevived2] = useState(false);
  const totalDamageRef = useRef(0);
  const combatOverRef = useRef(false);

  // ── Mana regen tick (every 3s, +5% mana) ────────────────────
  useEffect(() => {
    if (combatOver) return;
    const t = setInterval(() => {
      setP1Mana(m => Math.min(character.max_mana, m + Math.floor(character.max_mana * 0.05)));
      if (p2) setP2Mana(m => Math.min(p2.max_mana, m + Math.floor(p2.max_mana * 0.05)));
    }, 3000);
    return () => clearInterval(t);
  }, [combatOver, p2]);

  // ── Enemy attack loop (every 2.5s / adjusted by enemy level) ─
  useEffect(() => {
    if (combatOver) return;
    const speed = Math.max(1500, 3000 - enemy.level * 80);
    const t = setInterval(() => {
      if (combatOverRef.current) return;
      enemyAttackTick();
    }, speed);
    return () => clearInterval(t);
  }, [combatOver, enemyDebuffs, dotEffects]);

  // ── Countdown cooldowns every second ─────────────────────────
  useEffect(() => {
    if (combatOver) return;
    const t = setInterval(() => {
      setP1Cooldowns(prev => {
        const n = { ...prev };
        Object.keys(n).forEach(k => { n[k] = Math.max(0, n[k] - 1); });
        return n;
      });
      setP2Cooldowns(prev => {
        const n = { ...prev };
        Object.keys(n).forEach(k => { n[k] = Math.max(0, n[k] - 1); });
        return n;
      });
      setP1GCD(g => Math.max(0, g - 1));
      setP2GCD(g => Math.max(0, g - 1));
      // Tick DoTs
      setDotEffects(prev => {
        const next = [];
        prev.forEach(d => {
          if (d.turns <= 0) return;
          if (d.isHot) {
            // Heal P1 (or both in coop)
            setP1Hp(h => Math.min(boosted.max_hp, h + d.heal_amount));
            if (isCoopMode) setP2Hp(h => Math.min(boostedP2.max_hp, h + Math.floor(d.heal_amount * 0.5)));
          } else {
            setEnemyHp(h => {
              const newH = Math.max(0, h - d.damage);
              if (newH <= 0 && !combatOverRef.current) {
                triggerVictory();
              }
              return newH;
            });
          }
          next.push({ ...d, turns: d.turns - 1 });
        });
        return next.filter(d => d.turns > 0);
      });
      // Tick enemy debuffs
      setEnemyDebuffs(prev => prev.map(d => ({ ...d, turns: d.turns - 1 })).filter(d => d.turns > 0));
    }, 1000);
    return () => clearInterval(t);
  }, [combatOver, boosted.max_hp]);

  const addLog = useCallback((text, type) => setLogs(prev => [...prev, { text, type }]), []);

  const triggerVictory = useCallback(() => {
    if (combatOverRef.current) return;
    combatOverRef.current = true;
    setCombatOver(true);
    setP1Hp(h => {
      setP2Hp(h2 => {
        setTimeout(() => onCombatEnd({
          victory: true, playerHp: h, playerMana: p1Mana,
          p2Hp: h2, p2Mana: p2Mana,
          totalDamage: totalDamageRef.current,
          combosPerformed, coopCombosPerformed,
        }), 1800);
        return h2;
      });
      return h;
    });
    addLog(`${enemy.name} has been slain! Victory!`, "victory");
  }, [p1Mana, p2Mana, combosPerformed, coopCombosPerformed]);

  const enemyAttackTick = useCallback(() => {
    setEnemyHp(eHp => {
      if (eHp <= 0) return eHp;
      // Enemy hits a random player (or only P1 in solo)
      const target = isCoopMode && Math.random() > 0.5 ? "p2" : "p1";
      const targetBoosted = target === "p2" ? boostedP2 : boosted;

      // Calculate attack accounting for debuffs
      let atkMult = 1;
      setEnemyDebuffs(dbs => { dbs.forEach(d => { if (d.stat === "attack") atkMult *= d.mult; }); return dbs; });

      const rawDmg = Math.max(1, Math.floor(enemy.attack * atkMult * (0.8 + Math.random() * 0.4)) - Math.floor((targetBoosted.defense || 0) * 0.5));

      if (target === "p1") {
        // Dodge check
        if (Math.random() < (boosted.dodge_chance || 0)) {
          addLog(`${character.name} dodges!`, "dodge"); return eHp;
        }
        const reflectPct = boosted.reflect_damage || 0;
        setP1Hp(h => {
          const newH = Math.max(0, h - rawDmg);
          if (rawDmg > 0) { setShakeP1(true); setTimeout(() => setShakeP1(false), 300); }
          if (newH <= 0 && !combatOverRef.current) {
            if (boosted.combat_revive_once && !hasRevived1) {
              setHasRevived1(true);
              addLog(`✦ ${character.name} survives on 1 HP!`, "buff");
              return 1;
            }
            if (isCoopMode) {
              addLog(`${character.name} falls! ${p2?.name} fights on!`, "defeat");
              return 0;
            }
            combatOverRef.current = true;
            setCombatOver(true);
            addLog(`${character.name} has been defeated...`, "defeat");
            setTimeout(() => onCombatEnd({ victory: false, playerHp: 0, playerMana: p1Mana, totalDamage: totalDamageRef.current, combosPerformed, coopCombosPerformed }), 1800);
          }
          if (reflectPct > 0) {
            const ref = Math.floor(rawDmg * reflectPct);
            setEnemyHp(eH2 => Math.max(0, eH2 - ref));
            addLog(`Reflected ${ref} damage!`, "player_damage");
          }
          return newH;
        });
        addLog(`${enemy.name} strikes ${character.name} for ${rawDmg}!`, "enemy_damage");
      } else {
        if (Math.random() < (boostedP2.dodge_chance || 0)) {
          addLog(`${p2.name} dodges!`, "dodge"); return eHp;
        }
        setP2Hp(h => {
          const newH = Math.max(0, h - rawDmg);
          if (rawDmg > 0) { setShakeP2(true); setTimeout(() => setShakeP2(false), 300); }
          if (newH <= 0 && !combatOverRef.current) {
            if (boostedP2.combat_revive_once && !hasRevived2) {
              setHasRevived2(true);
              addLog(`✦ ${p2.name} survives on 1 HP!`, "buff");
              return 1;
            }
            addLog(`${p2.name} falls!`, "defeat");
          }
          return newH;
        });
        addLog(`${enemy.name} strikes ${p2.name} for ${rawDmg}!`, "enemy_damage");
      }
      return eHp;
    });
  }, [boosted, boostedP2, enemy, isCoopMode, hasRevived1, hasRevived2]);

  // ── Use an ability ────────────────────────────────────────────
  const useAbility = useCallback((ability, player = "p1") => {
    if (combatOverRef.current) return;
    const cooldowns = player === "p1" ? p1Cooldowns : p2Cooldowns;
    const setCooldowns = player === "p1" ? setP1Cooldowns : setP2Cooldowns;
    const gcd = player === "p1" ? p1GCD : p2GCD;
    const setGCD = player === "p1" ? setP1GCD : setP2GCD;
    const mana = player === "p1" ? p1Mana : p2Mana;
    const setMana = player === "p1" ? setP1Mana : setP2Mana;
    const char = player === "p1" ? character : p2;
    const bst = player === "p1" ? boosted : boostedP2;
    const logPrefix = isCoopMode ? `[${char.name}] ` : "";

    if (gcd > 0) { addLog("Still on global cooldown!", "info"); return; }
    if (cooldowns[ability.id] > 0) { addLog(`${ability.name} is on cooldown!`, "info"); return; }
    const manaCostReduction = bst.mana_cost_reduction || 0;
    const effectiveCost = Math.max(0, Math.round(ability.mana_cost * (1 - manaCostReduction)));
    if (effectiveCost > mana) { addLog(`${logPrefix}Not enough mana!`, "info"); return; }

    setMana(m => m - effectiveCost);
    setGCD(1); // 1s global cooldown
    if (ability.cooldown) setCooldowns(prev => ({ ...prev, [ability.id]: ability.cooldown }));

    // ── Primer + Combo logic ──────────────────────────────────
    const p1ClassOrSpec = character.multiclass_spec || character.class_type;
    const p2ClassOrSpec = p2 ? (p2.multiclass_spec || p2.class_type) : null;
    const { newPrimers, soloCombo, coopCombo } = applyAbility({
      abilityId: ability.id,
      currentPrimers: enemyPrimers,
      player,
      p1ClassOrSpec,
      p2ClassOrSpec,
    });
    setEnemyPrimers(newPrimers);

    // ── Calculate base damage ─────────────────────────────────
    const globalMult = bst.damage_mult_global || 1;
    let atk = bst.attack;
    // Apply buffs (simplification — we track them in enemy debuffs, player buffs skipped for RT)
    let baseDmg = Math.max(1, Math.floor(atk * (ability.damage_mult || 0)) - Math.floor(enemy.defense * 0.3) + Math.floor(Math.random() * 6));
    baseDmg = Math.floor(baseDmg * globalMult);
    const isCrit = ability.crit_force || Math.random() * 100 < (bst.crit_chance || 5);
    if (isCrit) baseDmg = Math.floor(baseDmg * (1.5 + ((bst.crit_damage_mult || 1) - 1)));

    let finalDmg = baseDmg;
    let comboFired = null;

    if (soloCombo) {
      finalDmg = calcComboDamage(baseDmg, soloCombo);
      comboFired = soloCombo;
      setCombosPerformed(c => c + 1);
      addLog(`${logPrefix}✦ COMBO: ${soloCombo.name}! ${finalDmg} damage!`, "combo");
    } else if (coopCombo) {
      finalDmg = calcComboDamage(baseDmg, coopCombo);
      comboFired = coopCombo;
      setCoopCombosPerformed(c => c + 1);
      addLog(`🌟 COOP COMBO: ${coopCombo.name}! ${finalDmg} damage!`, "coop_combo");
      // Coop combo can heal both players
      if (coopCombo.heal_percent) {
        setP1Hp(h => Math.min(boosted.max_hp, h + Math.floor(boosted.max_hp * coopCombo.heal_percent)));
        if (p2) setP2Hp(h => Math.min(boostedP2.max_hp, h + Math.floor(boostedP2.max_hp * coopCombo.heal_percent)));
        addLog(`Both players healed for ${Math.round(coopCombo.heal_percent * 100)}% HP!`, "heal");
      }
      if (coopCombo.extra_debuff) setEnemyDebuffs(prev => [...prev, coopCombo.extra_debuff]);
      if (coopCombo.dot_on_enemy) {
        const d = coopCombo.dot_on_enemy;
        const dmgPerTurn = Math.floor(enemy.hp * d.damage_percent);
        setDotEffects(prev => [...prev, { damage: dmgPerTurn, turns: d.turns }]);
        addLog(`Enemy burns for ${dmgPerTurn}/s for ${d.turns}s!`, "dot");
      }
    } else if (isCrit) {
      addLog(`${logPrefix}⚡CRIT! ${ability.name} — ${finalDmg} damage!`, "crit");
    }

    if (comboFired) setFlashCombo(comboFired);

    // ── Apply ability type ────────────────────────────────────
    if (ability.type === "damage" || ability.type === "damage_heal") {
      if ((ability.damage_mult || 0) > 0) {
        totalDamageRef.current += finalDmg;
        setEnemyHp(h => {
          const newH = Math.max(0, h - finalDmg);
          if (newH <= 0) triggerVictory();
          return newH;
        });
        setShakeEnemy(true); setTimeout(() => setShakeEnemy(false), 200);
        if (!soloCombo && !coopCombo && !isCrit) addLog(`${logPrefix}${ability.name} hits for ${finalDmg}!`, player === "p2" ? "p2_damage" : "player_damage");
        // Lifesteal / damage_heal
        if (ability.type === "damage_heal" && ability.heal_percent_of_damage) {
          const healAmt = Math.floor(finalDmg * ability.heal_percent_of_damage * (1 + (bst.heal_bonus_percent || 0)));
          if (player === "p1") setP1Hp(h => Math.min(boosted.max_hp, h + healAmt));
          else setP2Hp(h => Math.min(boostedP2.max_hp, h + healAmt));
          addLog(`${logPrefix}Healed ${healAmt} HP from ${ability.name}!`, "heal");
        }
      }
      if (ability.dot) {
        const dotDmg = ability.dot.damage + (bst.dot_bonus || 0);
        setDotEffects(prev => [...prev, { damage: dotDmg, turns: ability.dot.turns }]);
        addLog(`${logPrefix}${enemy.name} poisoned! ${dotDmg}/s for ${ability.dot.turns}s`, "dot");
      }
      if (ability.debuff) setEnemyDebuffs(prev => [...prev, ability.debuff]);
      // Prime log
      const primedBy = ABILITY_PRIMERS[ability.id] || [];
      if (primedBy.length && !soloCombo && !coopCombo) {
        addLog(`${logPrefix}Applied: ${primedBy.map(p => PRIMER_TAGS[p]?.label || p).join(", ")}`, "buff");
      }

    } else if (ability.type === "heal") {
      const healAmt = Math.floor((ability.heal_percent || 0.3) * char.max_hp * (1 + (bst.heal_bonus_percent || 0)));
      if (player === "p1") setP1Hp(h => Math.min(boosted.max_hp, h + healAmt));
      else setP2Hp(h => Math.min(boostedP2.max_hp, h + healAmt));
      addLog(`${logPrefix}${ability.name} heals ${healAmt} HP!`, "heal");

    } else if (ability.type === "heal_mana") {
      const m = Math.min(char.max_mana, (player === "p1" ? p1Mana : p2Mana) + (ability.heal_mana_flat || 40));
      setMana(m);
      if (ability.heal_percent) {
        const hpAmt = Math.floor(char.max_hp * ability.heal_percent);
        if (player === "p1") setP1Hp(h => Math.min(boosted.max_hp, h + hpAmt));
        else setP2Hp(h => Math.min(boostedP2.max_hp, h + hpAmt));
      }
      addLog(`${logPrefix}${ability.name}! Mana and HP restored.`, "buff");

    } else if (ability.type === "hot") {
      const hotAmt = Math.floor(char.max_hp * (ability.heal_percent_per_turn || 0.12) * (1 + (bst.heal_bonus_percent || 0)));
      setDotEffects(prev => [...prev, { heal_amount: hotAmt, turns: ability.turns || 3, isHot: true }]);
      addLog(`${logPrefix}${ability.name}! +${hotAmt} HP/s for ${ability.turns}s`, "heal");

    } else if (ability.type === "buff") {
      addLog(`${logPrefix}${ability.name} activated!`, "buff");
      if (ability.debuff) setEnemyDebuffs(prev => [...prev, ability.debuff]);

    } else if (ability.type === "debuff") {
      if (ability.debuff) setEnemyDebuffs(prev => [...prev, ability.debuff]);
      addLog(`${logPrefix}${ability.name}! ${enemy.name} weakened.`, "buff");
    }

    // Double-hit on rogue acrobatics
    if (bst.double_hit_chance > 0 && Math.random() < bst.double_hit_chance && (ability.damage_mult || 0) > 0 && !comboFired) {
      const dmg2 = Math.floor(finalDmg * 0.7);
      totalDamageRef.current += dmg2;
      setEnemyHp(h => { const n = Math.max(0, h - dmg2); if (n <= 0) triggerVictory(); return n; });
      addLog(`${logPrefix}⚡ Double-strike! +${dmg2}`, "crit");
    }
  }, [p1Cooldowns, p2Cooldowns, p1GCD, p2GCD, p1Mana, p2Mana, enemyPrimers, combatOver, enemy, boosted, boostedP2]);

  // ── Get all abilities for a character ────────────────────────
  const getAbilities = (char) => {
    const base = CLASSES[char.class_type]?.abilities || [];
    const specAbilities = char.multiclass_spec ? (MULTICLASS_SPECS[char.multiclass_spec]?.bonus_abilities || []) : [];
    return [...base, ...specAbilities];
  };

  const p1Abilities = getAbilities(character);
  const p2Abilities = p2 ? getAbilities(p2) : [];

  const p1HpPct = Math.max(0, (p1Hp / boosted.max_hp) * 100);
  const p2HpPct = p2 ? Math.max(0, (p2Hp / (boostedP2?.max_hp || 1)) * 100) : 0;
  const enemyHpPct = Math.max(0, (enemyHp / enemy.hp) * 100);
  const p1ManaPct = (p1Mana / character.max_mana) * 100;
  const p2ManaPct = p2 ? (p2Mana / p2.max_mana) * 100 : 0;

  const cls1 = CLASSES[character.class_type];
  const cls2 = p2 ? CLASSES[p2.class_type] : null;

  return (
    <div className="p-3 md:p-5 max-w-2xl mx-auto select-none">
      {/* Arena */}
      <div className="relative bg-gradient-to-br from-secondary/50 via-card to-secondary/50 rounded-2xl border border-border/50 p-4 mb-3">
        <AnimatePresence>
          {flashCombo && <ComboFlash combo={flashCombo} onDone={() => setFlashCombo(null)} />}
        </AnimatePresence>

        {/* Fighters row */}
        <div className={`flex items-center justify-between mb-4 ${isCoopMode ? "gap-1" : "gap-4"}`}>
          {/* P1 */}
          <motion.div animate={shakeP1 ? { x: [-6, 6, -3, 3, 0] } : {}} className="text-center flex-1">
            <div className="text-4xl mb-0.5">{cls1?.icon}</div>
            <div className="font-heading text-xs font-bold truncate">{character.name}</div>
            {spec1 && <div className="text-xs text-primary/70 truncate">{spec1.icon} {spec1.name}</div>}
            <div className="text-xs text-muted-foreground">Lv.{character.level}</div>
          </motion.div>

          {/* P2 */}
          {isCoopMode && (
            <motion.div animate={shakeP2 ? { x: [-6, 6, -3, 3, 0] } : {}} className="text-center flex-1">
              <div className="text-4xl mb-0.5">{cls2?.icon}</div>
              <div className="font-heading text-xs font-bold truncate">{p2.name}</div>
              {spec2 && <div className="text-xs text-primary/70 truncate">{spec2.icon} {spec2.name}</div>}
              <div className="text-xs text-muted-foreground">Lv.{p2.level}</div>
            </motion.div>
          )}

          <div className="text-primary/30 font-bold text-xl mx-1">VS</div>

          {/* Enemy */}
          <motion.div animate={shakeEnemy ? { x: [-6, 6, -3, 3, 0] } : {}} className="text-center flex-1">
            <div className="text-4xl mb-0.5">{enemy.icon}</div>
            <div className="font-heading text-xs font-bold text-destructive/90 truncate">{enemy.name}</div>
            <div className="text-xs text-muted-foreground">Lv.{enemy.level}</div>
          </motion.div>
        </div>

        {/* HP / Mana bars */}
        <div className={`grid gap-3 mb-2 ${isCoopMode ? "grid-cols-3" : "grid-cols-2"}`}>
          {/* P1 bars */}
          <div>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-red-300">❤ {p1Hp}/{boosted.max_hp}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-0.5">
              <motion.div className="h-full bg-gradient-to-r from-red-700 to-red-400 rounded-full" animate={{ width: `${p1HpPct}%` }} transition={{ duration: 0.3 }} />
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-blue-700 to-blue-400 rounded-full" animate={{ width: `${p1ManaPct}%` }} transition={{ duration: 0.3 }} />
            </div>
            <div className="text-xs text-blue-300 mt-0.5">⚡ {p1Mana}/{character.max_mana}</div>
          </div>

          {/* P2 bars */}
          {isCoopMode && (
            <div>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-red-300">❤ {p2Hp}/{boostedP2?.max_hp}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-0.5">
                <motion.div className="h-full bg-gradient-to-r from-orange-700 to-orange-400 rounded-full" animate={{ width: `${p2HpPct}%` }} transition={{ duration: 0.3 }} />
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-violet-700 to-violet-400 rounded-full" animate={{ width: `${p2ManaPct}%` }} transition={{ duration: 0.3 }} />
              </div>
              <div className="text-xs text-blue-300 mt-0.5">⚡ {p2Mana}/{p2?.max_mana}</div>
            </div>
          )}

          {/* Enemy bars */}
          <div className="text-right">
            <div className="flex justify-end text-xs mb-0.5">
              <span className="text-destructive/80">☠ {enemyHp}/{enemy.hp}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-destructive to-red-500 rounded-full ml-auto" animate={{ width: `${enemyHpPct}%` }} transition={{ duration: 0.3 }}
                style={{ marginLeft: "auto" }} />
            </div>
            {enemyDebuffs.length > 0 && (
              <div className="text-xs text-purple-300 mt-0.5">{enemyDebuffs.map(d => `${d.stat}↓`).join(", ")}</div>
            )}
          </div>
        </div>

        {/* Primers on enemy */}
        <PrimerBadges primers={enemyPrimers} label="Enemy Status" />
      </div>

      {/* Combat Log */}
      <CombatLog logs={logs} />

      {/* Victory / Defeat */}
      <AnimatePresence>
        {combatOver && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="mt-3 text-center p-4 rounded-xl border border-primary/30 bg-card/80">
            {enemyHp <= 0 ? (
              <>
                <Trophy className="w-8 h-8 text-primary mx-auto mb-1" />
                <div className="font-heading text-lg text-primary font-bold">Victory!</div>
                <div className="text-sm text-muted-foreground">+{enemy.xp_reward} XP • +{enemy.gold_reward} Gold</div>
                {(combosPerformed + coopCombosPerformed) > 0 && (
                  <div className="text-xs text-primary/70 mt-0.5">
                    {combosPerformed} solo combo{combosPerformed !== 1 ? "s" : ""}
                    {coopCombosPerformed > 0 && ` • ${coopCombosPerformed} coop combo${coopCombosPerformed !== 1 ? "s" : ""}`}
                  </div>
                )}
              </>
            ) : (
              <>
                <Skull className="w-8 h-8 text-destructive mx-auto mb-1" />
                <div className="font-heading text-lg text-destructive font-bold">Defeated</div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action bars */}
      {!combatOver && (
        <div className={`mt-3 ${isCoopMode ? "grid grid-cols-2 gap-3" : ""}`}>
          {/* P1 action bar */}
          <div>
            {isCoopMode && (
              <div className="flex items-center gap-1 mb-1.5">
                <span className="text-lg">{cls1?.icon}</span>
                <span className="font-heading text-xs text-muted-foreground">{character.name}</span>
                {p1GCD > 0 && <span className="text-xs text-orange-400 ml-auto">GCD {p1GCD}s</span>}
              </div>
            )}
            <div className="grid grid-cols-2 gap-1.5">
              {p1Abilities.map(ability => (
                <AbilityButton key={ability.id} ability={ability}
                  cooldownLeft={p1Cooldowns[ability.id] || 0}
                  maxCooldown={ability.cooldown || 0}
                  manaOk={p1Mana >= Math.max(0, Math.round(ability.mana_cost * (1 - (boosted.mana_cost_reduction || 0))))}
                  isPlayerTurn={p1GCD === 0}
                  onUse={() => useAbility(ability, "p1")} />
              ))}
            </div>
            {!isCoopMode && (
              <button onClick={onFlee} className="w-full mt-2 text-xs text-muted-foreground hover:text-destructive transition-colors py-1.5">
                <ArrowLeft className="w-3 h-3 inline mr-1" />Flee (-10% HP)
              </button>
            )}
          </div>

          {/* P2 action bar */}
          {isCoopMode && p2 && (
            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <span className="text-lg">{cls2?.icon}</span>
                <span className="font-heading text-xs text-muted-foreground">{p2.name}</span>
                {p2GCD > 0 && <span className="text-xs text-orange-400 ml-auto">GCD {p2GCD}s</span>}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {p2Abilities.map(ability => (
                  <AbilityButton key={ability.id} ability={ability}
                    cooldownLeft={p2Cooldowns[ability.id] || 0}
                    maxCooldown={ability.cooldown || 0}
                    manaOk={p2Mana >= Math.max(0, Math.round(ability.mana_cost * (1 - (boostedP2?.mana_cost_reduction || 0))))}
                    isPlayerTurn={p2GCD === 0}
                    onUse={() => useAbility(ability, "p2")} />
                ))}
              </div>
            </div>
          )}

          {isCoopMode && (
            <div className="col-span-2 mt-1">
              <button onClick={onFlee} className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors py-1">
                <ArrowLeft className="w-3 h-3 inline mr-1" />Flee combat
              </button>
            </div>
          )}
        </div>
      )}

      {/* Combo hint bar */}
      {enemyPrimers.length > 0 && !combatOver && (
        <div className="mt-2 bg-muted/20 rounded-lg p-2 border border-primary/20">
          <div className="text-xs text-primary/70 font-heading mb-1">⚡ COMBO OPPORTUNITY</div>
          <PrimerBadges primers={enemyPrimers} />
          {SOLO_COMBOS.filter(c => c.requires_primer.every(p => enemyPrimers.includes(p))).map(c => (
            <div key={c.id} className="text-xs text-muted-foreground mt-0.5">
              → Detonate with: {c.detonator_abilities.join(", ")} for <span className="text-primary">{c.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}