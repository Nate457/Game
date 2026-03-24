import { ABILITY_PRIMERS, checkSoloCombo, checkCoopCombo } from "./coopData";

// ============================================================
// COMBO ENGINE — tracks active primers on an enemy and fires combos
// Designed to work with both solo and coop combat
// ============================================================

export function createCombatState() {
  return {
    enemyPrimers: [],       // array of active primer tags on enemy
    lastAbilityP1: null,    // last ability id used by P1
    lastAbilityP2: null,    // last ability id used by P2
    comboReady: null,       // pending combo that can be detonated
  };
}

// Apply primers from an ability use
// Returns { newPrimers, soloCombo, coopCombo }
export function applyAbility({
  abilityId,
  currentPrimers,
  player = "p1",          // "p1" | "p2"
  p1ClassOrSpec,
  p2ClassOrSpec,
}) {
  const addedPrimers = ABILITY_PRIMERS[abilityId] || [];
  
  // Check solo combo BEFORE adding new primers
  const soloCombo = checkSoloCombo(currentPrimers, abilityId);
  
  // Check coop combo — does adding these primers detonate something P1 already set?
  let coopCombo = null;
  if (player === "p2" && addedPrimers.length > 0) {
    for (const primer of addedPrimers) {
      const cc = checkCoopCombo(currentPrimers, primer, p1ClassOrSpec, p2ClassOrSpec);
      if (cc) { coopCombo = cc; break; }
    }
  }
  if (player === "p1" && addedPrimers.length > 0) {
    for (const primer of addedPrimers) {
      const cc = checkCoopCombo(currentPrimers, primer, p2ClassOrSpec, p1ClassOrSpec);
      if (cc) { coopCombo = cc; break; }
    }
  }

  // If a solo combo fires, consume the primers it requires
  let newPrimers;
  if (soloCombo) {
    newPrimers = currentPrimers.filter(p => !soloCombo.requires_primer.includes(p));
  } else if (coopCombo) {
    // Consume all primers involved
    const consumed = [...coopCombo.p1_sets, ...coopCombo.p2_detonates];
    newPrimers = [...currentPrimers.filter(p => !consumed.includes(p)), ...addedPrimers.filter(p => !consumed.includes(p))];
  } else {
    // Add new primers (max 4, oldest get dropped)
    const merged = [...currentPrimers];
    addedPrimers.forEach(p => {
      if (!merged.includes(p)) merged.push(p);
    });
    newPrimers = merged.slice(-4);
  }

  return { newPrimers, soloCombo, coopCombo };
}

// Calculate combo damage bonus
export function calcComboDamage(baseDamage, combo) {
  return Math.floor(baseDamage * combo.damage_bonus_mult);
}