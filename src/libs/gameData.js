// ============================================================
// ZONE DEFINITIONS
// ============================================================
export const ZONES = {
  whispering_woods: {
    id: "whispering_woods",
    name: "Whispering Woods",
    description: "An ancient forest where the trees murmur forgotten secrets.",
    level_range: [1, 5],
    theme: "forest",
    color: "from-emerald-900/40 to-green-950/60",
    icon: "🌲",
    enemies_theme: "forest creatures, corrupted wildlife, dark druids, twisted treants",
    faction: "forest_spirits",
    unlocked: true,
  },
  crimson_wastes: {
    id: "crimson_wastes",
    name: "Crimson Wastes",
    description: "A scorched desert where blood-red sand stretches endlessly.",
    level_range: [4, 9],
    theme: "desert",
    color: "from-red-900/40 to-orange-950/60",
    icon: "🏜️",
    enemies_theme: "sand elementals, scorpion beasts, desert raiders, fire djinn",
    faction: "crimson_order",
    unlocked: false,
    unlock_level: 4,
  },
  frozen_depths: {
    id: "frozen_depths",
    name: "Frozen Depths",
    description: "Caverns of eternal ice hiding ancient terrors beneath glaciers.",
    level_range: [8, 14],
    theme: "ice_cave",
    color: "from-cyan-900/40 to-blue-950/60",
    icon: "❄️",
    enemies_theme: "frost wraiths, ice golems, frozen undead, crystal spiders",
    faction: "frost_conclave",
    unlocked: false,
    unlock_level: 8,
  },
  shadow_citadel: {
    id: "shadow_citadel",
    name: "Shadow Citadel",
    description: "A fortress of darkness where the Void Lord gathers power.",
    level_range: [12, 20],
    theme: "dark_castle",
    color: "from-purple-900/40 to-violet-950/60",
    icon: "🏰",
    enemies_theme: "shadow knights, void mages, demonic beasts, dark overlords",
    faction: "void_hunters",
    unlocked: false,
    unlock_level: 12,
  },
  abyssal_depths: {
    id: "abyssal_depths",
    name: "Abyssal Depths",
    description: "The sunken ruins beneath a corrupted sea. Ancient gods sleep here.",
    level_range: [16, 25],
    theme: "deep_sea_ruins",
    color: "from-indigo-900/40 to-slate-950/60",
    icon: "🌊",
    enemies_theme: "sea horrors, drowned undead, abyssal leviathans, kraken cultists",
    faction: "void_hunters",
    unlocked: false,
    unlock_level: 16,
  },
  celestial_peak: {
    id: "celestial_peak",
    name: "Celestial Peak",
    description: "The storm-wreathed mountain where the gods once walked.",
    level_range: [22, 30],
    theme: "sky_citadel",
    color: "from-yellow-900/40 to-amber-950/60",
    icon: "⛰️",
    enemies_theme: "storm giants, divine constructs, fallen celestials, world-enders",
    faction: "void_hunters",
    unlocked: false,
    unlock_level: 22,
  },
};

// ============================================================
// CLASS DEFINITIONS
// ============================================================
export const CLASSES = {
  warrior: {
    name: "Warrior",
    icon: "⚔️",
    description: "A fearless melee combatant with heavy armor and devastating attacks.",
    base_hp: 130,
    base_mana: 30,
    base_attack: 15,
    base_defense: 9,
    base_speed: 8,
    base_crit: 6,
    abilities: [
      { id: "slash", name: "Slash", mana_cost: 0, damage_mult: 1.0, description: "A basic sword strike.", type: "damage" },
      { id: "shield_bash", name: "Shield Bash", mana_cost: 8, damage_mult: 1.4, description: "Bash with your shield, dealing heavy damage and reducing enemy attack.", type: "damage", debuff: { stat: "attack", mult: 0.8, turns: 2 } },
      { id: "war_cry", name: "War Cry", mana_cost: 12, damage_mult: 0, description: "Boosts your attack by 35% for 3 turns.", type: "buff", buff: { stat: "attack", mult: 1.35, turns: 3 } },
      { id: "whirlwind", name: "Whirlwind", mana_cost: 20, damage_mult: 2.2, description: "Devastating spinning attack.", type: "damage" },
      { id: "berserker_rage", name: "Berserker Rage", mana_cost: 25, damage_mult: 0, description: "Double attack for 2 turns, but halve defense.", type: "buff", buff: { stat: "attack", mult: 2.0, turns: 2 }, self_debuff: { stat: "defense", mult: 0.5, turns: 2 } },
      { id: "execute", name: "Execute", mana_cost: 30, damage_mult: 4.0, description: "Devastate an enemy below 30% HP.", type: "damage", condition: "enemy_low_hp" },
    ],
  },
  mage: {
    name: "Mage",
    icon: "🔮",
    description: "A master of arcane arts wielding devastating spells from afar.",
    base_hp: 75,
    base_mana: 120,
    base_attack: 9,
    base_defense: 3,
    base_speed: 12,
    base_crit: 12,
    abilities: [
      { id: "arcane_bolt", name: "Arcane Bolt", mana_cost: 5, damage_mult: 1.3, description: "A bolt of pure arcane energy.", type: "damage" },
      { id: "fireball", name: "Fireball", mana_cost: 15, damage_mult: 2.2, description: "Hurl a massive fireball.", type: "damage" },
      { id: "ice_shield", name: "Ice Shield", mana_cost: 12, damage_mult: 0, description: "Boosts defense by 60% for 3 turns.", type: "buff", buff: { stat: "defense", mult: 1.6, turns: 3 } },
      { id: "meteor_strike", name: "Meteor Strike", mana_cost: 35, damage_mult: 3.8, description: "Call down a devastating meteor.", type: "damage" },
      { id: "mana_surge", name: "Mana Surge", mana_cost: 20, damage_mult: 0, description: "Restore 40 mana and boost spell power.", type: "heal_mana", heal_mana_flat: 40, buff: { stat: "attack", mult: 1.2, turns: 2 } },
      { id: "void_rift", name: "Void Rift", mana_cost: 45, damage_mult: 5.0, description: "Tear reality. Massive arcane damage.", type: "damage" },
    ],
  },
  rogue: {
    name: "Rogue",
    icon: "🗡️",
    description: "A swift shadow-dancer who strikes from the darkness with lethal precision.",
    base_hp: 90,
    base_mana: 65,
    base_attack: 13,
    base_defense: 5,
    base_speed: 18,
    base_crit: 18,
    abilities: [
      { id: "stab", name: "Stab", mana_cost: 0, damage_mult: 1.1, description: "A quick dagger strike.", type: "damage" },
      { id: "poison_blade", name: "Poison Blade", mana_cost: 10, damage_mult: 1.5, description: "Coat your blade in venom, dealing damage over time.", type: "damage", dot: { damage: 5, turns: 3 } },
      { id: "shadowstep", name: "Shadowstep", mana_cost: 15, damage_mult: 0, description: "Vanish, boosting attack by 60% and crit by 30% for 2 turns.", type: "buff", buff: { stat: "attack", mult: 1.6, turns: 2 }, crit_buff: 30 },
      { id: "assassinate", name: "Assassinate", mana_cost: 25, damage_mult: 3.2, description: "Strike from the shadows for massive damage.", type: "damage" },
      { id: "smoke_bomb", name: "Smoke Bomb", mana_cost: 18, damage_mult: 0, description: "Blind the enemy, reducing their attack by 50% for 3 turns.", type: "debuff", debuff: { stat: "attack", mult: 0.5, turns: 3 } },
      { id: "death_mark", name: "Death Mark", mana_cost: 35, damage_mult: 6.0, description: "Mark a target for death. Lethal strike with massive crit chance.", type: "damage", crit_force: true },
    ],
  },
  healer: {
    name: "Healer",
    icon: "✨",
    description: "A divine channeler who mends wounds and smites the unholy.",
    base_hp: 95,
    base_mana: 90,
    base_attack: 8,
    base_defense: 7,
    base_speed: 10,
    base_crit: 8,
    abilities: [
      { id: "smite", name: "Smite", mana_cost: 5, damage_mult: 1.2, description: "Holy light damages the enemy.", type: "damage" },
      { id: "heal", name: "Heal", mana_cost: 15, damage_mult: 0, description: "Restore 35% of your max HP.", type: "heal", heal_percent: 0.35 },
      { id: "divine_shield", name: "Divine Shield", mana_cost: 20, damage_mult: 0, description: "Boosts defense by 90% for 2 turns.", type: "buff", buff: { stat: "defense", mult: 1.9, turns: 2 } },
      { id: "holy_nova", name: "Holy Nova", mana_cost: 25, damage_mult: 2.4, description: "A burst of holy energy.", type: "damage" },
      { id: "mending_aura", name: "Mending Aura", mana_cost: 20, damage_mult: 0, description: "Heal 15% HP per turn for 3 turns.", type: "hot", heal_percent_per_turn: 0.15, turns: 3 },
      { id: "divine_judgment", name: "Divine Judgment", mana_cost: 40, damage_mult: 4.5, description: "Call down divine wrath. Massive holy damage.", type: "damage" },
    ],
  },
};

// ============================================================
// SKILL TREE DEFINITIONS  (3 branches × 8 nodes per class)
// nodes: id, name, desc, cost (skill points), branch, tier (1-4), prereq ids[], effect
// ============================================================
export const SKILL_TREES = {
  warrior: {
    branches: [
      { id: "fury", name: "Fury", icon: "🔥", description: "Unleash primal rage for overwhelming offense." },
      { id: "fortress", name: "Fortress", icon: "🛡️", description: "Become an immovable wall of steel." },
      { id: "warlord", name: "Warlord", icon: "👑", description: "Master tactics and inspire greatness." },
    ],
    nodes: [
      // Fury branch
      { id: "fury_1", name: "Iron Muscles", branch: "fury", tier: 1, cost: 1, prereqs: [], effect: { attack: 3 }, description: "+3 Attack" },
      { id: "fury_2", name: "Bloodlust", branch: "fury", tier: 2, cost: 2, prereqs: ["fury_1"], effect: { attack: 5, crit_chance: 5 }, description: "+5 Atk, +5% Crit" },
      { id: "fury_3a", name: "Cleave", branch: "fury", tier: 3, cost: 2, prereqs: ["fury_2"], effect: { ability_mod: "slash", damage_mult_bonus: 0.3 }, description: "Slash hits 30% harder" },
      { id: "fury_3b", name: "Savage Strikes", branch: "fury", tier: 3, cost: 2, prereqs: ["fury_2"], effect: { crit_chance: 10, crit_damage_mult: 0.5 }, description: "+10% Crit, Crits deal 50% more" },
      { id: "fury_4", name: "Unstoppable", branch: "fury", tier: 4, cost: 3, prereqs: ["fury_3a", "fury_3b"], effect: { attack: 10, ability_unlock: "berserker_rage_enhanced" }, description: "+10 Atk. Berserker Rage duration +1" },
      { id: "fury_5", name: "Avatar of War", branch: "fury", tier: 4, cost: 4, prereqs: ["fury_4"], effect: { attack: 15, damage_mult_global: 0.25 }, description: "+15 Atk, all damage +25%" },
      // Fortress branch
      { id: "fort_1", name: "Thick Skin", branch: "fortress", tier: 1, cost: 1, prereqs: [], effect: { defense: 4, max_hp: 20 }, description: "+4 Def, +20 HP" },
      { id: "fort_2", name: "Bulwark", branch: "fortress", tier: 2, cost: 2, prereqs: ["fort_1"], effect: { defense: 6, max_hp: 30 }, description: "+6 Def, +30 HP" },
      { id: "fort_3a", name: "Retaliation", branch: "fortress", tier: 3, cost: 2, prereqs: ["fort_2"], effect: { reflect_damage: 0.15 }, description: "Reflect 15% dmg taken back" },
      { id: "fort_3b", name: "Last Stand", branch: "fortress", tier: 3, cost: 2, prereqs: ["fort_2"], effect: { low_hp_defense_mult: 1.5 }, description: "+50% Def when below 30% HP" },
      { id: "fort_4", name: "Indomitable", branch: "fortress", tier: 4, cost: 3, prereqs: ["fort_3a", "fort_3b"], effect: { max_hp: 60, defense: 10 }, description: "+60 HP, +10 Def" },
      { id: "fort_5", name: "Immortal Iron", branch: "fortress", tier: 4, cost: 4, prereqs: ["fort_4"], effect: { max_hp: 100, ability_unlock: "shield_wall" }, description: "+100 HP, unlock Shield Wall" },
      // Warlord branch
      { id: "warlord_1", name: "Tactical Mind", branch: "warlord", tier: 1, cost: 1, prereqs: [], effect: { speed: 3 }, description: "+3 Speed" },
      { id: "warlord_2", name: "Battle Hardened", branch: "warlord", tier: 2, cost: 2, prereqs: ["warlord_1"], effect: { attack: 3, defense: 3, speed: 3 }, description: "+3 Atk/Def/Spd" },
      { id: "warlord_3a", name: "Execute Mastery", branch: "warlord", tier: 3, cost: 2, prereqs: ["warlord_2"], effect: { ability_mod: "execute", execute_threshold: 0.45 }, description: "Execute triggers at 45% HP" },
      { id: "warlord_3b", name: "Rally", branch: "warlord", tier: 3, cost: 2, prereqs: ["warlord_2"], effect: { post_kill_heal_percent: 0.2 }, description: "Heal 20% HP after killing blow" },
      { id: "warlord_4", name: "Supreme Commander", branch: "warlord", tier: 4, cost: 3, prereqs: ["warlord_3a", "warlord_3b"], effect: { attack: 8, crit_chance: 8, speed: 8 }, description: "+8 Atk/Crit/Spd" },
      { id: "warlord_5", name: "Conqueror", branch: "warlord", tier: 4, cost: 4, prereqs: ["warlord_4"], effect: { gold_bonus: 0.5, xp_bonus: 0.25 }, description: "+50% Gold, +25% XP gained" },
    ],
  },
  mage: {
    branches: [
      { id: "arcane", name: "Arcane", icon: "✨", description: "Pure magical mastery and raw spell power." },
      { id: "destruction", name: "Destruction", icon: "💥", description: "Obliterate enemies with raw elemental force." },
      { id: "chronomancy", name: "Chronomancy", icon: "⌛", description: "Bend time to gain impossible advantages." },
    ],
    nodes: [
      { id: "arc_1", name: "Spell Affinity", branch: "arcane", tier: 1, cost: 1, prereqs: [], effect: { attack: 3 }, description: "+3 Spell Power" },
      { id: "arc_2", name: "Mana Font", branch: "arcane", tier: 2, cost: 2, prereqs: ["arc_1"], effect: { max_mana: 25 }, description: "+25 Max Mana" },
      { id: "arc_3a", name: "Arcane Mastery", branch: "arcane", tier: 3, cost: 2, prereqs: ["arc_2"], effect: { ability_mod: "arcane_bolt", damage_mult_bonus: 0.5 }, description: "Arcane Bolt +50% damage" },
      { id: "arc_3b", name: "Efficient Casting", branch: "arcane", tier: 3, cost: 2, prereqs: ["arc_2"], effect: { mana_cost_reduction: 0.2 }, description: "All spells cost 20% less mana" },
      { id: "arc_4", name: "Arcane Surge", branch: "arcane", tier: 4, cost: 3, prereqs: ["arc_3a", "arc_3b"], effect: { attack: 10, max_mana: 40 }, description: "+10 Spellpower, +40 Mana" },
      { id: "arc_5", name: "Singularity", branch: "arcane", tier: 4, cost: 4, prereqs: ["arc_4"], effect: { ability_unlock: "singularity", damage_mult_global: 0.3 }, description: "All damage +30%, unlock Singularity" },
      { id: "dest_1", name: "Fire Mastery", branch: "destruction", tier: 1, cost: 1, prereqs: [], effect: { crit_chance: 5 }, description: "+5% Crit Chance" },
      { id: "dest_2", name: "Ignition", branch: "destruction", tier: 2, cost: 2, prereqs: ["dest_1"], effect: { crit_chance: 5, crit_damage_mult: 0.3 }, description: "+5% Crit, Crits +30% dmg" },
      { id: "dest_3a", name: "Inferno", branch: "destruction", tier: 3, cost: 2, prereqs: ["dest_2"], effect: { ability_mod: "fireball", damage_mult_bonus: 0.6 }, description: "Fireball +60% damage" },
      { id: "dest_3b", name: "Chain Reaction", branch: "destruction", tier: 3, cost: 2, prereqs: ["dest_2"], effect: { execute_threshold_percent: 0.3 }, description: "Killing blows deal 30% splash" },
      { id: "dest_4", name: "Armageddon", branch: "destruction", tier: 4, cost: 3, prereqs: ["dest_3a", "dest_3b"], effect: { ability_mod: "meteor_strike", damage_mult_bonus: 1.0 }, description: "Meteor Strike +100% damage" },
      { id: "dest_5", name: "World Ender", branch: "destruction", tier: 4, cost: 4, prereqs: ["dest_4"], effect: { damage_mult_global: 0.4, ability_unlock: "apocalypse" }, description: "All damage +40%, unlock Apocalypse" },
      { id: "chron_1", name: "Time Sense", branch: "chronomancy", tier: 1, cost: 1, prereqs: [], effect: { speed: 5 }, description: "+5 Speed" },
      { id: "chron_2", name: "Haste", branch: "chronomancy", tier: 2, cost: 2, prereqs: ["chron_1"], effect: { speed: 8, crit_chance: 4 }, description: "+8 Speed, +4% Crit" },
      { id: "chron_3a", name: "Time Echo", branch: "chronomancy", tier: 3, cost: 2, prereqs: ["chron_2"], effect: { double_cast_chance: 0.2 }, description: "20% chance to cast twice" },
      { id: "chron_3b", name: "Rewind", branch: "chronomancy", tier: 3, cost: 2, prereqs: ["chron_2"], effect: { combat_revive_once: true }, description: "Once per combat, survive lethal hit with 1 HP" },
      { id: "chron_4", name: "Temporal Mastery", branch: "chronomancy", tier: 4, cost: 3, prereqs: ["chron_3a", "chron_3b"], effect: { speed: 15, mana_cost_reduction: 0.15 }, description: "+15 Speed, -15% mana costs" },
      { id: "chron_5", name: "Timeless", branch: "chronomancy", tier: 4, cost: 4, prereqs: ["chron_4"], effect: { xp_bonus: 0.5, gold_bonus: 0.25 }, description: "+50% XP, +25% Gold from all sources" },
    ],
  },
  rogue: {
    branches: [
      { id: "shadow", name: "Shadow", icon: "🌑", description: "Harness darkness for invisibility and lethality." },
      { id: "venom", name: "Venom", icon: "☠️", description: "Coat blades in deadly poisons and rot." },
      { id: "acrobatics", name: "Acrobatics", icon: "⚡", description: "Move faster than thought, strike before seen." },
    ],
    nodes: [
      { id: "shad_1", name: "Dark Veil", branch: "shadow", tier: 1, cost: 1, prereqs: [], effect: { crit_chance: 6 }, description: "+6% Crit Chance" },
      { id: "shad_2", name: "Shadow Step", branch: "shadow", tier: 2, cost: 2, prereqs: ["shad_1"], effect: { crit_chance: 8, crit_damage_mult: 0.4 }, description: "+8% Crit, Crits +40% dmg" },
      { id: "shad_3a", name: "Shroud", branch: "shadow", tier: 3, cost: 2, prereqs: ["shad_2"], effect: { dodge_chance: 0.1 }, description: "10% chance to dodge attacks" },
      { id: "shad_3b", name: "Assassin's Mark", branch: "shadow", tier: 3, cost: 2, prereqs: ["shad_2"], effect: { first_strike_mult: 0.5 }, description: "First attack each combat +50% damage" },
      { id: "shad_4", name: "Death's Embrace", branch: "shadow", tier: 4, cost: 3, prereqs: ["shad_3a", "shad_3b"], effect: { crit_chance: 12, ability_mod: "assassinate", damage_mult_bonus: 0.8 }, description: "+12% Crit, Assassinate +80% dmg" },
      { id: "shad_5", name: "One with Shadows", branch: "shadow", tier: 4, cost: 4, prereqs: ["shad_4"], effect: { damage_mult_global: 0.35, ability_unlock: "phantom_strike" }, description: "All damage +35%, unlock Phantom Strike" },
      { id: "venom_1", name: "Toxicology", branch: "venom", tier: 1, cost: 1, prereqs: [], effect: { attack: 3 }, description: "+3 Attack" },
      { id: "venom_2", name: "Virulent Toxin", branch: "venom", tier: 2, cost: 2, prereqs: ["venom_1"], effect: { ability_mod: "poison_blade", dot_bonus: 5 }, description: "Poison Blade DoT +5 dmg/turn" },
      { id: "venom_3a", name: "Necrotic Edge", branch: "venom", tier: 3, cost: 2, prereqs: ["venom_2"], effect: { attack: 6, dot_spread_chance: 0.3 }, description: "+6 Atk, 30% chance to spread DoT" },
      { id: "venom_3b", name: "Lethal Dose", branch: "venom", tier: 3, cost: 2, prereqs: ["venom_2"], effect: { ability_mod: "poison_blade", damage_mult_bonus: 0.5 }, description: "Poison Blade base damage +50%" },
      { id: "venom_4", name: "Death's Touch", branch: "venom", tier: 4, cost: 3, prereqs: ["venom_3a", "venom_3b"], effect: { attack: 10, dot_bonus: 10 }, description: "+10 Atk, +10 DoT damage per turn" },
      { id: "venom_5", name: "Plague Bringer", branch: "venom", tier: 4, cost: 4, prereqs: ["venom_4"], effect: { ability_unlock: "plague_cloud", damage_mult_global: 0.2 }, description: "Unlock Plague Cloud, +20% damage" },
      { id: "acro_1", name: "Quick Feet", branch: "acrobatics", tier: 1, cost: 1, prereqs: [], effect: { speed: 6 }, description: "+6 Speed" },
      { id: "acro_2", name: "Blur", branch: "acrobatics", tier: 2, cost: 2, prereqs: ["acro_1"], effect: { speed: 8, dodge_chance: 0.05 }, description: "+8 Speed, +5% Dodge" },
      { id: "acro_3a", name: "Flurry", branch: "acrobatics", tier: 3, cost: 2, prereqs: ["acro_2"], effect: { double_hit_chance: 0.2 }, description: "20% chance to hit twice" },
      { id: "acro_3b", name: "Evasion Master", branch: "acrobatics", tier: 3, cost: 2, prereqs: ["acro_2"], effect: { dodge_chance: 0.12 }, description: "+12% Dodge Chance" },
      { id: "acro_4", name: "Ghost Form", branch: "acrobatics", tier: 4, cost: 3, prereqs: ["acro_3a", "acro_3b"], effect: { speed: 15, dodge_chance: 0.1 }, description: "+15 Speed, +10% Dodge" },
      { id: "acro_5", name: "Untouchable", branch: "acrobatics", tier: 4, cost: 4, prereqs: ["acro_4"], effect: { dodge_chance: 0.2, xp_bonus: 0.3 }, description: "+20% Dodge, +30% XP" },
    ],
  },
  healer: {
    branches: [
      { id: "restoration", name: "Restoration", icon: "💚", description: "Master the sacred art of mending flesh." },
      { id: "holy", name: "Holy Wrath", icon: "⚡", description: "Channel divine fury to smite your foes." },
      { id: "abjuration", name: "Abjuration", icon: "🔵", description: "Ward yourself and bend fate." },
    ],
    nodes: [
      { id: "rest_1", name: "Gentle Touch", branch: "restoration", tier: 1, cost: 1, prereqs: [], effect: { max_hp: 20 }, description: "+20 Max HP" },
      { id: "rest_2", name: "Sacred Mending", branch: "restoration", tier: 2, cost: 2, prereqs: ["rest_1"], effect: { heal_bonus_percent: 0.2, max_hp: 25 }, description: "+20% Heal effectiveness, +25 HP" },
      { id: "rest_3a", name: "Overflowing Light", branch: "restoration", tier: 3, cost: 2, prereqs: ["rest_2"], effect: { heal_bonus_percent: 0.3 }, description: "Heals are 30% more effective" },
      { id: "rest_3b", name: "Regeneration", branch: "restoration", tier: 3, cost: 2, prereqs: ["rest_2"], effect: { passive_regen_percent: 0.05 }, description: "Restore 5% HP each combat turn passively" },
      { id: "rest_4", name: "Lifebinder", branch: "restoration", tier: 4, cost: 3, prereqs: ["rest_3a", "rest_3b"], effect: { max_hp: 60, heal_bonus_percent: 0.4 }, description: "+60 HP, Heals +40% more" },
      { id: "rest_5", name: "Divine Incarnation", branch: "restoration", tier: 4, cost: 4, prereqs: ["rest_4"], effect: { ability_unlock: "resurrection_aura", max_hp: 100 }, description: "+100 HP, unlock Resurrection Aura" },
      { id: "holy_1", name: "Blessed Weapon", branch: "holy", tier: 1, cost: 1, prereqs: [], effect: { attack: 4 }, description: "+4 Holy Attack" },
      { id: "holy_2", name: "Sanctified Strikes", branch: "holy", tier: 2, cost: 2, prereqs: ["holy_1"], effect: { attack: 5, crit_chance: 6 }, description: "+5 Atk, +6% Crit" },
      { id: "holy_3a", name: "Smite Mastery", branch: "holy", tier: 3, cost: 2, prereqs: ["holy_2"], effect: { ability_mod: "smite", damage_mult_bonus: 0.6 }, description: "Smite +60% damage" },
      { id: "holy_3b", name: "Holy Flames", branch: "holy", tier: 3, cost: 2, prereqs: ["holy_2"], effect: { ability_mod: "holy_nova", damage_mult_bonus: 0.5, dot: { damage: 8, turns: 2 } }, description: "Holy Nova +50% dmg, applies burn" },
      { id: "holy_4", name: "Wrath of Heaven", branch: "holy", tier: 4, cost: 3, prereqs: ["holy_3a", "holy_3b"], effect: { attack: 10, ability_mod: "divine_judgment", damage_mult_bonus: 0.8 }, description: "+10 Atk, Divine Judgment +80%" },
      { id: "holy_5", name: "Harbinger", branch: "holy", tier: 4, cost: 4, prereqs: ["holy_4"], effect: { damage_mult_global: 0.3, ability_unlock: "armageddon_light" }, description: "+30% All Damage, unlock Armageddon Light" },
      { id: "abj_1", name: "Ward", branch: "abjuration", tier: 1, cost: 1, prereqs: [], effect: { defense: 4 }, description: "+4 Defense" },
      { id: "abj_2", name: "Barrier", branch: "abjuration", tier: 2, cost: 2, prereqs: ["abj_1"], effect: { defense: 5, max_mana: 20 }, description: "+5 Def, +20 Mana" },
      { id: "abj_3a", name: "Holy Aegis", branch: "abjuration", tier: 3, cost: 2, prereqs: ["abj_2"], effect: { ability_mod: "divine_shield", duration_bonus: 1 }, description: "Divine Shield lasts +1 turn" },
      { id: "abj_3b", name: "Mana Conduit", branch: "abjuration", tier: 3, cost: 2, prereqs: ["abj_2"], effect: { max_mana: 40, mana_cost_reduction: 0.15 }, description: "+40 Mana, -15% spell costs" },
      { id: "abj_4", name: "Sanctum", branch: "abjuration", tier: 4, cost: 3, prereqs: ["abj_3a", "abj_3b"], effect: { defense: 10, max_mana: 40 }, description: "+10 Def, +40 Mana" },
      { id: "abj_5", name: "Aegis of the Eternal", branch: "abjuration", tier: 4, cost: 4, prereqs: ["abj_4"], effect: { reflect_damage: 0.2, combat_revive_once: true }, description: "Reflect 20% damage, survive death once" },
    ],
  },
};

// ============================================================
// MAIN STORY CHAPTERS (30 chapters)
// ============================================================
export const STORY_CHAPTERS = [
  { id: 0, title: "The Awakening", act: 1, zone: "whispering_woods", min_level: 1, key: "ch0_awakening", summary: "You wake in the Whispering Woods with no memory. An old hermit finds you." },
  { id: 1, title: "Roots of Corruption", act: 1, zone: "whispering_woods", min_level: 1, key: "ch1_roots", summary: "Dark rot spreads through the forest. The spirits cry out in agony." },
  { id: 2, title: "The Hermit's Warning", act: 1, zone: "whispering_woods", min_level: 2, key: "ch2_warning", summary: "The hermit reveals the Void Lord has returned. You must gather allies." },
  { id: 3, title: "Trial of the Ancients", act: 1, zone: "whispering_woods", min_level: 3, key: "ch3_trial", summary: "The ancient forest spirits test your worth before granting their blessing." },
  { id: 4, title: "The First Fragment", act: 1, zone: "whispering_woods", min_level: 4, key: "ch4_fragment", summary: "You recover the first fragment of the Shattered Crown." },
  { id: 5, title: "Into the Wastes", act: 1, zone: "crimson_wastes", min_level: 4, key: "ch5_wastes", summary: "The second fragment lies somewhere in the Crimson Wastes. You venture forth." },
  { id: 6, title: "The Crimson Order", act: 2, zone: "crimson_wastes", min_level: 5, key: "ch6_order", summary: "A faction known as the Crimson Order controls the wastes. Friend or foe?" },
  { id: 7, title: "Blood in the Sand", act: 2, zone: "crimson_wastes", min_level: 6, key: "ch7_blood", summary: "The Order's leader sends you on a test of loyalty — against their enemies." },
  { id: 8, title: "The Desert Tomb", act: 2, zone: "crimson_wastes", min_level: 7, key: "ch8_tomb", summary: "Beneath the wastes lies an ancient tomb where the second fragment rests." },
  { id: 9, title: "Betrayal at Dusk", act: 2, zone: "crimson_wastes", min_level: 8, key: "ch9_betrayal", summary: "The Crimson Order's true motives are revealed. You barely escape." },
  { id: 10, title: "The Frozen Path", act: 2, zone: "frozen_depths", min_level: 8, key: "ch10_frozen", summary: "The trail leads into the ice-locked caverns of the Frozen Depths." },
  { id: 11, title: "Voices in the Ice", act: 3, zone: "frozen_depths", min_level: 9, key: "ch11_voices", summary: "Frozen within the glacier walls are ancient warriors, still whispering." },
  { id: 12, title: "The Frost Conclave", act: 3, zone: "frozen_depths", min_level: 10, key: "ch12_conclave", summary: "A sect of mages who sealed themselves away to protect a great secret." },
  { id: 13, title: "Shattering Ice", act: 3, zone: "frozen_depths", min_level: 11, key: "ch13_ice", summary: "A Void-touched ice colossus guards the third crown fragment." },
  { id: 14, title: "The Void Whispers", act: 3, zone: "frozen_depths", min_level: 12, key: "ch14_whispers", summary: "The Void Lord speaks to you directly for the first time. A chilling promise." },
  { id: 15, title: "Gates of Shadow", act: 3, zone: "shadow_citadel", min_level: 12, key: "ch15_gates", summary: "The Shadow Citadel looms ahead — the Void Lord's stronghold." },
  { id: 16, title: "The Dark Council", act: 4, zone: "shadow_citadel", min_level: 13, key: "ch16_council", summary: "Four generals serve the Void Lord. Each must fall before you reach him." },
  { id: 17, title: "Shadows of the Past", act: 4, zone: "shadow_citadel", min_level: 14, key: "ch17_past", summary: "The Citadel reveals your true origins. The truth is devastating." },
  { id: 18, title: "Breaking the Council", act: 4, zone: "shadow_citadel", min_level: 15, key: "ch18_breaking", summary: "You defeat three of the four generals. The citadel begins to crack." },
  { id: 19, title: "The Fourth General", act: 4, zone: "shadow_citadel", min_level: 16, key: "ch19_general", summary: "The fourth general is someone you know. A terrible choice awaits." },
  { id: 20, title: "The Drowned Archive", act: 4, zone: "abyssal_depths", min_level: 16, key: "ch20_archive", summary: "The final crown fragment was cast into the deep. You must dive into the Abyss." },
  { id: 21, title: "Under Sunless Waters", act: 5, zone: "abyssal_depths", min_level: 17, key: "ch21_waters", summary: "The Abyssal Depths hold memories of the world's first war against the Void." },
  { id: 22, title: "The Sleeping God", act: 5, zone: "abyssal_depths", min_level: 18, key: "ch22_god", summary: "A chained ancient god sleeps here. Its dreams are your nightmares." },
  { id: 23, title: "Crown Reclaimed", act: 5, zone: "abyssal_depths", min_level: 19, key: "ch23_crown", summary: "The last fragment is seized. The Shattered Crown is whole again." },
  { id: 24, title: "The Void Bleeds", act: 5, zone: "abyssal_depths", min_level: 20, key: "ch24_void", summary: "With the crown whole, the Void Lord's power is diminished — but he is desperate." },
  { id: 25, title: "The Storm's Eye", act: 5, zone: "celestial_peak", min_level: 22, key: "ch25_storm", summary: "The final battle will be fought at the peak of the world." },
  { id: 26, title: "Ascent", act: 6, zone: "celestial_peak", min_level: 23, key: "ch26_ascent", summary: "The climb to Celestial Peak is treacherous. Every step costs." },
  { id: 27, title: "Echoes of the Divine", act: 6, zone: "celestial_peak", min_level: 25, key: "ch27_divine", summary: "Fallen gods litter the path. Their power can be claimed — at a cost." },
  { id: 28, title: "The Void Lord Rises", act: 6, zone: "celestial_peak", min_level: 27, key: "ch28_rises", summary: "He is vast. He is everything. And he has waited for this moment." },
  { id: 29, title: "End of Echoes", act: 6, zone: "celestial_peak", min_level: 29, key: "ch29_end", summary: "The final confrontation. The fate of the Realm of Echoes is decided." },
  { id: 30, title: "Dawn of a New Age", act: 6, zone: "celestial_peak", min_level: 30, key: "ch30_dawn", summary: "Epilogue. What comes after the end of the world?" },
];

// ============================================================
// SIDE QUEST POOLS (spiral branches)
// ============================================================
export const SIDE_QUEST_POOLS = {
  whispering_woods: [
    "The Lost Forester", "Corrupted Sacred Grove", "The Mushroom Sage", "A Druid's Plea",
    "Spirit of the Oldest Tree", "Wolf Pack Leader", "Stolen Moonlight", "The Herbalist's Debt"
  ],
  crimson_wastes: [
    "The Buried City", "Merchant Caravan Rescue", "Djinn of Three Wishes", "The Scorpion King",
    "Desert Raiders' Cache", "The Glass Oasis", "Bones of the Fallen", "Crimson Relic Hunter"
  ],
  frozen_depths: [
    "The Frozen Expedition", "Voices of the Entombed", "Crystal Golem Awakening", "Ice Witch's Bargain",
    "The Thawing Prophecy", "Frost Rune Collector", "The Sunken Hot Spring", "Glacier's Memory"
  ],
  shadow_citadel: [
    "The Shadow Defector", "Dark Artifact Hunt", "Void Crystal Smugglers", "The Cursed Knight",
    "Prison Break", "The Librarian of Shadows", "Corrupted Familiar", "The Forgotten Throne"
  ],
  abyssal_depths: [
    "The Drowned Sailor's Ghost", "Coral Throne Dispute", "Ancient Sea Chart", "Sunken Treasury",
    "Leviathan's Bargain", "Tidal Witch's Curse", "The Pearl of Sorrows", "Abyssal Cult Disruption"
  ],
  celestial_peak: [
    "The Last Pilgrim", "Storm God's Trial", "The Broken Observatory", "Celestial Weapon Cache",
    "Echo of the First Hero", "Divine Forge Relit", "The Wandering Star", "Heaven's Final Guard"
  ],
};

// ============================================================
// FACTION DATA
// ============================================================
export const FACTIONS = {
  forest_spirits: { name: "Forest Spirits", icon: "🌿", description: "Ancient nature entities of the Whispering Woods" },
  crimson_order: { name: "Crimson Order", icon: "🔴", description: "A militant faction ruling the desert" },
  frost_conclave: { name: "Frost Conclave", icon: "🔵", description: "A secretive mage order of the Frozen Depths" },
  void_hunters: { name: "Void Hunters", icon: "🟣", description: "Warriors dedicated to fighting the Void Lord" },
  merchant_guild: { name: "Merchant Guild", icon: "🟡", description: "Traders who deal in secrets and coin alike" },
};

export const REPUTATION_TIERS = [
  { min: -1000, max: -500, name: "Hated", color: "text-red-600" },
  { min: -499, max: -100, name: "Hostile", color: "text-red-400" },
  { min: -99, max: 99, name: "Neutral", color: "text-muted-foreground" },
  { min: 100, max: 499, name: "Friendly", color: "text-green-400" },
  { min: 500, max: 999, name: "Honored", color: "text-blue-400" },
  { min: 1000, max: 9999, name: "Exalted", color: "text-primary" },
];

// ============================================================
// PROGRESSION UTILS
// ============================================================
export function getStatsForLevel(classType, level) {
  const cls = CLASSES[classType];
  return {
    max_hp: Math.floor(cls.base_hp + (level - 1) * 14),
    max_mana: Math.floor(cls.base_mana + (level - 1) * 6),
    attack: Math.floor(cls.base_attack + (level - 1) * 2.8),
    defense: Math.floor(cls.base_defense + (level - 1) * 1.8),
    speed: Math.floor(cls.base_speed + (level - 1) * 0.8),
    crit_chance: Math.min(75, Math.floor(cls.base_crit + (level - 1) * 0.5)),
  };
}

export function xpForLevel(level) {
  return Math.floor(100 * Math.pow(1.45, level - 1));
}

// Apply skill tree bonuses to base stats
export function applySkillTreeBonuses(baseStats, classType, unlockedSkills) {
  if (!unlockedSkills) return baseStats;
  const tree = SKILL_TREES[classType];
  if (!tree) return baseStats;

  const stats = { ...baseStats };
  stats.damage_mult_global = 1.0;
  stats.heal_bonus_percent = 0;
  stats.mana_cost_reduction = 0;
  stats.dodge_chance = 0;
  stats.crit_damage_mult = 1.0;
  stats.double_hit_chance = 0;
  stats.gold_bonus = 0;
  stats.xp_bonus = 0;
  stats.reflect_damage = 0;
  stats.passive_regen_percent = 0;
  stats.combat_revive_once = false;
  stats.unlocked_abilities = [];

  tree.nodes.forEach(node => {
    if (!unlockedSkills[node.id]) return;
    const e = node.effect;
    if (e.attack) stats.attack = (stats.attack || 0) + e.attack;
    if (e.defense) stats.defense = (stats.defense || 0) + e.defense;
    if (e.max_hp) stats.max_hp = (stats.max_hp || 0) + e.max_hp;
    if (e.max_mana) stats.max_mana = (stats.max_mana || 0) + e.max_mana;
    if (e.speed) stats.speed = (stats.speed || 0) + e.speed;
    if (e.crit_chance) stats.crit_chance = (stats.crit_chance || 0) + e.crit_chance;
    if (e.crit_damage_mult) stats.crit_damage_mult = (stats.crit_damage_mult || 1.0) + e.crit_damage_mult;
    if (e.damage_mult_global) stats.damage_mult_global = (stats.damage_mult_global || 1.0) + e.damage_mult_global;
    if (e.heal_bonus_percent) stats.heal_bonus_percent = (stats.heal_bonus_percent || 0) + e.heal_bonus_percent;
    if (e.mana_cost_reduction) stats.mana_cost_reduction = (stats.mana_cost_reduction || 0) + e.mana_cost_reduction;
    if (e.dodge_chance) stats.dodge_chance = (stats.dodge_chance || 0) + e.dodge_chance;
    if (e.double_hit_chance) stats.double_hit_chance = (stats.double_hit_chance || 0) + e.double_hit_chance;
    if (e.gold_bonus) stats.gold_bonus = (stats.gold_bonus || 0) + e.gold_bonus;
    if (e.xp_bonus) stats.xp_bonus = (stats.xp_bonus || 0) + e.xp_bonus;
    if (e.reflect_damage) stats.reflect_damage = (stats.reflect_damage || 0) + e.reflect_damage;
    if (e.passive_regen_percent) stats.passive_regen_percent = (stats.passive_regen_percent || 0) + e.passive_regen_percent;
    if (e.combat_revive_once) stats.combat_revive_once = true;
    if (e.ability_unlock) stats.unlocked_abilities.push(e.ability_unlock);
  });

  return stats;
}

export function getReputationTier(value) {
  return REPUTATION_TIERS.find(t => value >= t.min && value <= t.max) || REPUTATION_TIERS[2];
}

export function skillPointsForLevel(level) {
  // 1 point per level, bonus at milestone levels
  const milestones = [5, 10, 15, 20, 25, 30];
  return 1 + (milestones.includes(level) ? 1 : 0);
}