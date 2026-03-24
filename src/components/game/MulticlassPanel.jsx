import React from "react";
import { MULTICLASS_SPECS } from "@/lib/coopData";
import { CLASSES } from "@/lib/gameData";

const ELIGIBLE_SPECS_MAP = {
  warrior: ["spellblade", "shadowknight", "paladin"],
  mage: ["spellblade", "arcane_assassin", "archmage"],
  rogue: ["shadowknight", "arcane_assassin", "shadow_dancer"],
  healer: ["paladin", "archmage", "shadow_dancer"],
};
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, Zap, Heart, Sword, Shield } from "lucide-react";

export default function MulticlassPanel({ character, onSelectSpec }) {
  const isUnlocked = character.level >= 10;
  const eligible = ELIGIBLE_SPECS_MAP[character.class_type] || [];
  const currentSpec = character.multiclass_spec;

  if (!isUnlocked) {
    return (
      <div className="p-6 text-center">
        <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-heading text-lg text-muted-foreground">Multiclass Locked</h3>
        <p className="text-sm text-muted-foreground mt-1">Reach Level 10 to unlock a second class specialization.</p>
        <div className="mt-3 text-sm text-foreground/60">Current: Level {character.level} / 10</div>
        <div className="w-full bg-muted rounded-full h-1.5 mt-2">
          <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${Math.min(100, (character.level / 10) * 100)}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-1">
        <Unlock className="w-4 h-4 text-primary" />
        <h3 className="font-heading text-sm uppercase tracking-wider text-primary">Multiclass Specialization</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Choose a second class spec. Unlocks bonus abilities, passives, and unique coop combos.</p>

      <div className="space-y-3">
        {eligible.map(specId => {
          const spec = MULTICLASS_SPECS[specId];
          if (!spec) return null;
          const isActive = currentSpec === specId;
          const secondaryCls = CLASSES[spec.secondary];

          return (
            <motion.div
              key={specId}
              whileHover={{ scale: 1.01 }}
              className={`rounded-xl border p-4 transition-all cursor-pointer ${
                isActive
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                  : "border-border/40 bg-muted/20 hover:border-primary/40"
              }`}
              onClick={() => onSelectSpec(specId)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{spec.icon}</span>
                  <div>
                    <div className="font-heading font-bold text-sm">{spec.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {CLASSES[spec.primary]?.name} + {secondaryCls?.name}
                    </div>
                  </div>
                </div>
                {isActive && <Badge className="bg-primary text-primary-foreground text-xs">Active</Badge>}
              </div>

              <p className="text-xs text-muted-foreground mb-3">{spec.description}</p>

              {/* Passives */}
              <div className="flex flex-wrap gap-1 mb-3">
                {Object.entries(spec.passive).map(([k, v]) => (
                  <span key={k} className="text-xs bg-muted/40 text-foreground/70 px-1.5 py-0.5 rounded">
                    +{typeof v === "number" && v < 1 ? Math.round(v * 100) + "%" : v} {k.replace(/_/g, " ")}
                  </span>
                ))}
              </div>

              {/* Bonus abilities */}
              <div className="space-y-1">
                {spec.bonus_abilities.map(a => (
                  <div key={a.id} className="flex items-start gap-2 text-xs">
                    <span className="text-primary mt-0.5">✦</span>
                    <div>
                      <span className="font-semibold">{a.name}</span>
                      {a.cooldown && <span className="text-muted-foreground ml-1">({a.cooldown}s CD)</span>}
                      <span className="text-muted-foreground"> — {a.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}