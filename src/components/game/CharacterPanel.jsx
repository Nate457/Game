import React, { useState } from "react";
import { CLASSES, getStatsForLevel, applySkillTreeBonuses } from "@/lib/gameData";
import { MULTICLASS_SPECS } from "@/lib/coopData";
import { Heart, Zap, Sword, Shield, Coins, Star, Package, Award, Zap as Lightning, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SkillTreeView from "./SkillTreeView";
import ReputationPanel from "./ReputationPanel";
import MulticlassPanel from "./MulticlassPanel";

const RARITY_COLORS = {
  common: "text-foreground/60",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-primary",
};

const TABS = [
  { id: "stats", label: "Stats" },
  { id: "skills", label: "Skills" },
  { id: "multiclass", label: "Spec" },
  { id: "inventory", label: "Gear" },
  { id: "reputation", label: "Rep" },
];

export default function CharacterPanel({ character, onUnlockSkill, onSelectSpec }) {
  const [activeTab, setActiveTab] = useState("stats");
  const cls = CLASSES[character?.class_type];
  if (!character) return null;

  const boostedStats = applySkillTreeBonuses(
    { attack: character.attack, defense: character.defense, max_hp: character.max_hp, max_mana: character.max_mana, speed: character.speed || 10, crit_chance: character.crit_chance || 5 },
    character.class_type,
    character.skill_tree
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Character Header */}
      <div className="bg-card/80 border-b border-border/50 p-4 md:p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-5xl">{cls?.icon}</div>
          <div>
            <h2 className="font-heading text-2xl font-bold">{character.name}</h2>
            <p className="text-sm text-muted-foreground">Level {character.level} {cls?.name}</p>
            {character.titles?.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-1">
                {character.titles.map(t => (
                  <Badge key={t} variant="outline" className="text-xs text-primary border-primary/30">{t}</Badge>
                ))}
              </div>
            )}
            {character.multiclass_spec && MULTICLASS_SPECS[character.multiclass_spec] && (
              <p className="text-xs text-primary/80 mt-0.5">{MULTICLASS_SPECS[character.multiclass_spec].icon} {MULTICLASS_SPECS[character.multiclass_spec].name}</p>
            )}
            {(character.prestige_level || 0) > 0 && (
              <p className="text-xs text-primary mt-0.5">✦ Prestige {character.prestige_level}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "HP", value: `${character.current_hp}/${boostedStats.max_hp}`, color: "text-red-400" },
            { label: "Mana", value: `${character.current_mana}/${boostedStats.max_mana}`, color: "text-blue-400" },
            { label: "Atk", value: boostedStats.attack, color: "text-orange-400" },
            { label: "Def", value: boostedStats.defense, color: "text-cyan-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-muted/30 rounded-xl p-2 text-center">
              <div className={`text-base font-bold ${color}`}>{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-2 mt-2 text-center text-xs">
          {[
            { label: "Spd", value: boostedStats.speed || 10 },
            { label: "Crit%", value: `${boostedStats.crit_chance || 5}%` },
            { label: "Gold", value: character.gold },
            { label: "Quests", value: character.quests_completed },
            { label: "Kills", value: character.enemies_defeated },
          ].map(({ label, value }) => (
            <div key={label} className="bg-muted/20 rounded-lg p-1.5">
              <div className="font-bold text-foreground/90">{value}</div>
              <div className="text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/50">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-xs font-heading font-semibold tracking-wider uppercase transition-all ${
              activeTab === tab.id
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "stats" && (
        <div className="p-4">
          {/* Skill bonuses summary */}
          <div className="bg-muted/20 rounded-xl p-3 mb-4">
            <h4 className="font-heading text-xs text-muted-foreground uppercase tracking-wider mb-2">Skill Bonuses Active</h4>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {(boostedStats.damage_mult_global || 1) > 1 && (
                <div className="text-primary">+{Math.round(((boostedStats.damage_mult_global || 1) - 1) * 100)}% All Damage</div>
              )}
              {(boostedStats.heal_bonus_percent || 0) > 0 && (
                <div className="text-green-400">+{Math.round(boostedStats.heal_bonus_percent * 100)}% Healing</div>
              )}
              {(boostedStats.mana_cost_reduction || 0) > 0 && (
                <div className="text-blue-400">-{Math.round(boostedStats.mana_cost_reduction * 100)}% Mana Costs</div>
              )}
              {(boostedStats.dodge_chance || 0) > 0 && (
                <div className="text-purple-400">+{Math.round(boostedStats.dodge_chance * 100)}% Dodge</div>
              )}
              {(boostedStats.gold_bonus || 0) > 0 && (
                <div className="text-primary">+{Math.round(boostedStats.gold_bonus * 100)}% Gold</div>
              )}
              {(boostedStats.xp_bonus || 0) > 0 && (
                <div className="text-primary">+{Math.round(boostedStats.xp_bonus * 100)}% XP</div>
              )}
              {(boostedStats.reflect_damage || 0) > 0 && (
                <div className="text-orange-400">Reflect {Math.round(boostedStats.reflect_damage * 100)}% dmg</div>
              )}
              {boostedStats.combat_revive_once && (
                <div className="text-primary">✦ Survive Death Once</div>
              )}
              {Object.keys(character.skill_tree || {}).filter(k => character.skill_tree[k]).length === 0 && (
                <div className="col-span-2 text-muted-foreground italic">No skill bonuses yet — invest skill points!</div>
              )}
            </div>
          </div>

          {/* Abilities */}
          <h4 className="font-heading text-xs text-muted-foreground uppercase tracking-wider mb-3">Class Abilities</h4>
          <div className="grid grid-cols-2 gap-2">
            {cls?.abilities.map((a) => (
              <div key={a.id} className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-heading text-xs font-semibold">{a.name}</span>
                  {a.mana_cost > 0 && <span className="text-xs text-blue-400">{a.mana_cost} MP</span>}
                </div>
                <p className="text-xs text-muted-foreground">{a.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "skills" && (
        <SkillTreeView character={character} onUnlockSkill={onUnlockSkill} />
      )}

      {activeTab === "inventory" && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-primary" />
            <h3 className="font-heading text-sm text-muted-foreground uppercase tracking-wider">
              Inventory ({character.inventory?.length || 0})
            </h3>
          </div>
          {(!character.inventory || character.inventory.length === 0) ? (
            <p className="text-xs text-muted-foreground text-center py-8">No items yet. Complete quests to earn gear!</p>
          ) : (
            <div className="space-y-2">
              {character.inventory.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-muted/30 rounded-lg p-3">
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-semibold ${RARITY_COLORS[item.rarity] || "text-foreground"}`}>
                      {item.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.type} • +{item.stat_bonus} {item.stat_type}
                    </div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground/60 italic mt-0.5">{item.description}</div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs capitalize flex-shrink-0">{item.rarity}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "multiclass" && (
        <MulticlassPanel character={character} onSelectSpec={onSelectSpec} />
      )}

      {activeTab === "reputation" && (
        <ReputationPanel character={character} />
      )}
    </div>
  );
}