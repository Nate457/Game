import React from "react";
import { FACTIONS, getReputationTier } from "@/lib/gameData";

export default function ReputationPanel({ character }) {
  const reputation = character?.reputation || {};

  return (
    <div className="p-4">
      <h3 className="font-heading text-sm text-muted-foreground uppercase tracking-wider mb-4">Faction Reputation</h3>
      <div className="space-y-3">
        {Object.entries(FACTIONS).map(([key, faction]) => {
          const rep = reputation[key] || 0;
          const tier = getReputationTier(rep);
          const pct = Math.min(100, Math.max(0, ((rep + 1000) / 2000) * 100));

          return (
            <div key={key} className="bg-muted/20 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>{faction.icon}</span>
                  <span className="text-sm font-semibold">{faction.name}</span>
                </div>
                <span className={`text-xs font-heading font-bold ${tier.color}`}>{tier.name}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1 text-right">{rep > 0 ? "+" : ""}{rep}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}