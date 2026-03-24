// ============================================================
// MULTICLASS SPECS — unlocked at level 10 (1 secondary class)
// Each spec blends two classes with a unique identity
// ============================================================
export const MULTICLASS_SPECS = {
  // Warrior + Mage
  spellblade: {
    id: "spellblade",
    name: "Spellblade",
    icon: "🔥⚔️",
    primary: "warrior",
    secondary: "mage",
    description: "Channels arcane energy through steel. Melee attacks ignite with spell-fire.",
    bonus_abilities: [
      {
        id: "arcane_slash",
        name: "Arcane Slash",
        mana_cost: 12,
        damage_mult: 2.0,
        description: "Enchanted blade strike that deals physical + arcane damage.",
        type: "damage",
        element: "arcane",
        cooldown: 4,
      },
      {
        id: "runic_armor",
        name: "Runic Armor",
        mana_cost: 15,
        damage_mult: 0,
        description: "Armor glows with runes — +40% defense, reflect 20% magic damage for 3s.",
        type: "buff",
        buff: { stat: "defense", mult: 1.4, turns: 3 },
        cooldown: 8,
      },
    ],
    passive: { attack: 5, max_mana: 30, crit_chance: 8 },
  },
  // Warrior + Rogue
  shadowknight: {
    id: "shadowknight",
    name: "Shadow Knight",
    icon: "🌑⚔️",
    primary: "warrior",
    secondary: "rogue",
    description: "Heavy armor meets shadow arts. Unstoppable and invisible until the killing blow.",
    bonus_abilities: [
      {
        id: "shadow_charge",
        name: "Shadow Charge",
        mana_cost: 10,
        damage_mult: 2.5,
        description: "Vanish into shadow then burst out with a devastating charge.",
        type: "damage",
        element: "shadow",
        cooldown: 5,
      },
      {
        id: "blade_veil",
        name: "Blade Veil",
        mana_cost: 14,
        damage_mult: 0,
        description: "Phase into shadows — +60% dodge and +40% crit for 4s.",
        type: "buff",
        buff: { stat: "attack", mult: 1.4, turns: 4 },
        cooldown: 10,
      },
    ],
    passive: { crit_chance: 12, dodge_chance: 0.08, speed: 5 },
  },
  // Warrior + Healer
  paladin: {
    id: "paladin",
    name: "Paladin",
    icon: "✨⚔️",
    primary: "warrior",
    secondary: "healer",
    description: "Divine warrior who smites evil and heals allies simultaneously.",
    bonus_abilities: [
      {
        id: "holy_strike",
        name: "Holy Strike",
        mana_cost: 18,
        damage_mult: 2.2,
        description: "A consecrated blow that deals holy damage and heals you for 25% of damage dealt.",
        type: "damage_heal",
        heal_percent_of_damage: 0.25,
        element: "holy",
        cooldown: 5,
      },
      {
        id: "divine_aegis",
        name: "Divine Aegis",
        mana_cost: 20,
        damage_mult: 0,
        description: "Surround yourself in divine light — heal 40% HP and become immune for 2s.",
        type: "heal",
        heal_percent: 0.4,
        cooldown: 12,
      },
    ],
    passive: { max_hp: 50, defense: 6, heal_bonus_percent: 0.2 },
  },
  // Mage + Rogue
  arcane_assassin: {
    id: "arcane_assassin",
    name: "Arcane Assassin",
    icon: "✨🗡️",
    primary: "mage",
    secondary: "rogue",
    description: "Blinks through space to deliver explosive arcane bursts at point blank.",
    bonus_abilities: [
      {
        id: "blink_strike",
        name: "Blink Strike",
        mana_cost: 20,
        damage_mult: 3.5,
        description: "Teleport behind the enemy and detonate an arcane charge. Always crits.",
        type: "damage",
        crit_force: true,
        element: "arcane",
        cooldown: 6,
      },
      {
        id: "phase_shift",
        name: "Phase Shift",
        mana_cost: 15,
        damage_mult: 0,
        description: "Phase out of reality — dodge all attacks and restore 30 mana for 3s.",
        type: "buff",
        buff: { stat: "defense", mult: 2.0, turns: 3 },
        cooldown: 9,
      },
    ],
    passive: { crit_chance: 15, speed: 8, mana_cost_reduction: 0.1 },
  },
  // Mage + Healer
  archmage: {
    id: "archmage",
    name: "Archmage",
    icon: "🔮✨",
    primary: "mage",
    secondary: "healer",
    description: "Master of all magic schools. Spells weave between destruction and restoration.",
    bonus_abilities: [
      {
        id: "mana_nova",
        name: "Mana Nova",
        mana_cost: 30,
        damage_mult: 3.0,
        description: "Release a burst of raw mana — deals massive damage and heals you for 30% of damage.",
        type: "damage_heal",
        heal_percent_of_damage: 0.3,
        element: "arcane",
        cooldown: 7,
      },
      {
        id: "leyline_channel",
        name: "Leyline Channel",
        mana_cost: 0,
        damage_mult: 0,
        description: "Tap into leylines — restore 60 mana and 20% HP instantly.",
        type: "heal_mana",
        heal_mana_flat: 60,
        heal_percent: 0.2,
        cooldown: 10,
      },
    ],
    passive: { max_mana: 60, attack: 6, heal_bonus_percent: 0.25 },
  },
  // Rogue + Healer
  shadow_dancer: {
    id: "shadow_dancer",
    name: "Shadow Dancer",
    icon: "🌑✨",
    primary: "rogue",
    secondary: "healer",
    description: "Weaves between darkness and light — deadly strikes followed by miraculous recovery.",
    bonus_abilities: [
      {
        id: "life_steal",
        name: "Life Steal",
        mana_cost: 15,
        damage_mult: 2.8,
        description: "Drain the life force from your enemy — deal heavy damage and heal 50% of it.",
        type: "damage_heal",
        heal_percent_of_damage: 0.5,
        element: "shadow",
        cooldown: 5,
      },
      {
        id: "spirit_walk",
        name: "Spirit Walk",
        mana_cost: 18,
        damage_mult: 0,
        description: "Enter spirit form — become untargetable and regenerate 35% HP over 3s.",
        type: "hot",
        heal_percent_per_turn: 0.12,
        turns: 3,
        cooldown: 11,
      },
    ],
    passive: { crit_chance: 10, dodge_chance: 0.06, max_hp: 30 },
  },
};

// ============================================================
// COMBO SYSTEM
// Combos fire when specific "primed" states are stacked up.
// Solo combos: use 2+ abilities in sequence to detonate.
// Coop combos: P1 sets up a condition, P2 detonates it.
// ============================================================

// Primer tags — abilities can set these states on the enemy
export const PRIMER_TAGS = {
  burning: { icon: "🔥", color: "text-orange-400", label: "Burning" },
  chilled: { icon: "❄️", color: "text-cyan-400", label: "Chilled" },
  poisoned: { icon: "☠️", color: "text-green-400", label: "Poisoned" },
  shocked: { icon: "⚡", color: "text-yellow-400", label: "Shocked" },
  stunned: { icon: "💫", color: "text-purple-400", label: "Stunned" },
  marked: { icon: "🎯", color: "text-red-400", label: "Marked" },
  weakened: { icon: "💔", color: "text-pink-400", label: "Weakened" },
  blessed: { icon: "✨", color: "text-primary", label: "Blessed" },
};

// Which abilities set which primers (by ability id)
export const ABILITY_PRIMERS = {
  // Warrior
  war_cry: ["blessed"],
  shield_bash: ["stunned", "weakened"],
  whirlwind: ["marked"],
  // Mage
  fireball: ["burning"],
  meteor_strike: ["burning", "stunned"],
  ice_shield: ["chilled"],
  arcane_bolt: ["shocked"],
  void_rift: ["marked", "weakened"],
  // Rogue
  poison_blade: ["poisoned"],
  smoke_bomb: ["weakened"],
  shadowstep: ["marked"],
  // Healer
  smite: ["blessed"],
  divine_shield: ["blessed"],
  mending_aura: ["blessed"],
  // Multiclass
  arcane_slash: ["shocked", "burning"],
  shadow_charge: ["marked", "stunned"],
  holy_strike: ["blessed", "burning"],
  blink_strike: ["shocked", "marked"],
  mana_nova: ["shocked", "burning"],
  life_steal: ["weakened", "poisoned"],
};

// Solo combos — triggered when player uses a detonator ability on a primed enemy
export const SOLO_COMBOS = [
  {
    id: "ignition",
    name: "Ignition Burst",
    icon: "💥🔥",
    requires_primer: ["burning"],
    detonator_abilities: ["slash", "stab", "arcane_slash"],
    description: "Strike a burning enemy to cause a chain ignition!",
    damage_bonus_mult: 2.5,
    effect: "Explosion clears burning, deals 2.5x bonus damage",
    color: "from-orange-600 to-red-500",
  },
  {
    id: "frost_shatter",
    name: "Frost Shatter",
    icon: "💥❄️",
    requires_primer: ["chilled"],
    detonator_abilities: ["shield_bash", "war_cry", "arcane_slash", "shadow_charge"],
    description: "Smash a chilled enemy — they shatter for massive damage!",
    damage_bonus_mult: 3.0,
    effect: "Shatters chilled state for 3x damage + 2-turn stun",
    extra_debuff: { stat: "attack", mult: 0.4, turns: 2 },
    color: "from-cyan-600 to-blue-500",
  },
  {
    id: "venomous_execution",
    name: "Venomous Execution",
    icon: "💀☠️",
    requires_primer: ["poisoned"],
    detonator_abilities: ["assassinate", "execute", "death_mark"],
    description: "Execute a poisoned target — the venom explodes internally!",
    damage_bonus_mult: 4.0,
    effect: "Lethal combo — 4x damage, removes all DoTs but deals them all at once",
    color: "from-green-700 to-emerald-500",
  },
  {
    id: "thunder_smite",
    name: "Thunder Smite",
    icon: "⚡✨",
    requires_primer: ["shocked", "blessed"],
    detonator_abilities: ["smite", "holy_nova", "divine_judgment"],
    description: "Holy power meets electric charge — divine thunder!",
    damage_bonus_mult: 3.5,
    effect: "Holy + lightning fusion for 3.5x damage, heals 20% HP",
    heal_percent: 0.2,
    color: "from-yellow-500 to-primary",
  },
  {
    id: "marked_for_death",
    name: "Marked for Death",
    icon: "🎯💀",
    requires_primer: ["marked", "weakened"],
    detonator_abilities: ["death_mark", "void_rift", "blink_strike"],
    description: "Strike a marked and weakened foe — instant kill threshold applies!",
    damage_bonus_mult: 5.0,
    effect: "5x damage on marked + weakened targets",
    color: "from-purple-700 to-violet-500",
  },
];

// Coop combos — P1 sets up, P2 detonates (or both contribute)
export const COOP_COMBOS = [
  {
    id: "coop_inferno",
    name: "Inferno Storm",
    icon: "🔥⚡",
    p1_sets: ["burning"],
    p2_detonates: ["shocked"],
    any_class: true,
    description: "P1 ignites, P2 electrifies — an unstoppable firestorm erupts!",
    damage_bonus_mult: 4.5,
    aoe: true,
    effect: "Massive AoE explosion — 4.5x damage, enemy stunned for 3 turns",
    extra_debuff: { stat: "attack", mult: 0.3, turns: 3 },
    color: "from-orange-500 via-yellow-500 to-red-600",
  },
  {
    id: "coop_divine_blade",
    name: "Divine Blade",
    icon: "✨⚔️",
    p1_sets: ["blessed"],
    p2_detonates: ["marked"],
    class_combo: [["healer", "warrior"], ["paladin", "warrior"], ["healer", "shadowknight"]],
    description: "Healer blesses the warrior's blade — unstoppable holy execution!",
    damage_bonus_mult: 5.5,
    heal_percent: 0.3,
    effect: "5.5x holy damage + heals both players for 30%",
    color: "from-primary via-yellow-400 to-amber-300",
  },
  {
    id: "coop_shadow_storm",
    name: "Shadow Storm",
    icon: "🌑💥",
    p1_sets: ["marked", "poisoned"],
    p2_detonates: ["stunned"],
    class_combo: [["rogue", "warrior"], ["shadowknight", "rogue"], ["arcane_assassin", "warrior"]],
    description: "Rogue marks and poisons, warrior stuns — shadow storm detonates!",
    damage_bonus_mult: 6.0,
    effect: "Deadliest combo — 6x damage, enemy defense reduced to 0 for 2 turns",
    extra_debuff: { stat: "defense", mult: 0.0, turns: 2 },
    color: "from-purple-800 via-violet-600 to-purple-400",
  },
  {
    id: "coop_mana_surge_double",
    name: "Twin Arcane Surge",
    icon: "🔮🔮",
    p1_sets: ["shocked"],
    p2_detonates: ["shocked"],
    class_combo: [["mage", "mage"], ["archmage", "mage"], ["archmage", "archmage"], ["arcane_assassin", "mage"]],
    description: "Two mages synchronize their arcane energies — reality tears apart!",
    damage_bonus_mult: 7.0,
    effect: "7x arcane damage — highest possible magical combo",
    color: "from-blue-600 via-purple-500 to-violet-400",
  },
  {
    id: "coop_life_and_death",
    name: "Life and Death",
    icon: "💀✨",
    p1_sets: ["weakened"],
    p2_detonates: ["blessed"],
    class_combo: [["healer", "rogue"], ["shadow_dancer", "healer"], ["healer", "shadow_dancer"]],
    description: "Shadow walker drains life while healer amplifies the soul steal!",
    damage_bonus_mult: 4.0,
    heal_percent: 0.5,
    effect: "4x damage + heals BOTH players for 50% max HP",
    color: "from-green-600 via-emerald-500 to-teal-400",
  },
  {
    id: "coop_spellstrike",
    name: "Spellstrike",
    icon: "⚔️🔥",
    p1_sets: ["burning"],
    p2_detonates: ["burning"],
    class_combo: [["mage", "warrior"], ["spellblade", "mage"], ["mage", "spellblade"], ["spellblade", "spellblade"]],
    description: "Both players ignite together — a superheated inferno vaporizes the enemy!",
    damage_bonus_mult: 5.0,
    effect: "5x fire damage + enemy takes 10% max HP burn for 5 turns",
    dot_on_enemy: { damage_percent: 0.08, turns: 5 },
    color: "from-red-600 via-orange-500 to-yellow-400",
  },
];

// Get spec for a character (returns spec or null)
export function getMulticlassSpec(character) {
  return character?.multiclass_spec ? MULTICLASS_SPECS[character.multiclass_spec] : null;
}

// Get all available abilities for a character (base + multiclass bonus)
// Note: pass CLASSES from gameData as parameter to avoid circular dep
export function getAllAbilities(character, CLASSES) {
  const base = CLASSES?.[character.class_type]?.abilities || [];
  const spec = getMulticlassSpec(character);
  const bonus = spec?.bonus_abilities || [];
  return [...base, ...bonus];
}

// Check if a solo combo fires given current primers and detonator ability
export function checkSoloCombo(enemyPrimers, abilityId) {
  for (const combo of SOLO_COMBOS) {
    const hasAllPrimers = combo.requires_primer.every(p => enemyPrimers.includes(p));
    const isDetonator = combo.detonator_abilities.includes(abilityId);
    if (hasAllPrimers && isDetonator) return combo;
  }
  return null;
}

// Check if a coop combo fires given P1 primers, P2 primer being applied
export function checkCoopCombo(existingPrimers, newPrimer, p1ClassOrSpec, p2ClassOrSpec) {
  for (const combo of COOP_COMBOS) {
    const p1HasAll = combo.p1_sets.every(p => existingPrimers.includes(p));
    const p2Detonates = combo.p2_detonates.includes(newPrimer);
    if (!p1HasAll || !p2Detonates) continue;
    if (combo.any_class) return combo;
    if (combo.class_combo) {
      const match = combo.class_combo.some(([c1, c2]) =>
        (c1 === p1ClassOrSpec || c1 === p2ClassOrSpec) &&
        (c2 === p2ClassOrSpec || c2 === p1ClassOrSpec)
      );
      if (match) return combo;
    }
    return combo;
  }
  return null;
}