import React from "react";
import { ZONES } from "@/lib/gameData";
import { motion } from "framer-motion";
import { Lock, MapPin } from "lucide-react";

export default function WorldMap({ character, onSelectZone }) {
  const unlockedZones = character?.unlocked_zones || ["whispering_woods"];

  return (
    <div className="p-4 md:p-8">
      <div className="text-center mb-6">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary tracking-wider">World Map</h2>
        <p className="text-muted-foreground text-sm mt-1">Choose a zone to explore</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {Object.entries(ZONES).map(([key, zone], idx) => {
          const isUnlocked = unlockedZones.includes(key);
          const isCurrent = character?.current_zone === key;

          return (
            <motion.button
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => isUnlocked && onSelectZone(key)}
              disabled={!isUnlocked}
              className={`relative overflow-hidden rounded-xl border-2 p-6 text-left transition-all duration-300 ${
                isCurrent
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : isUnlocked
                  ? "border-border/50 bg-card/50 hover:border-primary/50 hover:shadow-md"
                  : "border-border/20 bg-muted/20 opacity-50 cursor-not-allowed"
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${zone.color} opacity-30`} />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-4xl">{zone.icon}</span>
                  {!isUnlocked && <Lock className="w-5 h-5 text-muted-foreground" />}
                  {isCurrent && (
                    <div className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                      <MapPin className="w-3 h-3" />
                      Current
                    </div>
                  )}
                </div>

                <h3 className="font-heading font-bold text-lg mb-1">{zone.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{zone.description}</p>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Lv. {zone.level_range[0]}–{zone.level_range[1]}</span>
                  {!isUnlocked && (
                    <span className="text-destructive">Unlocks at Lv. {zone.unlock_level}</span>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}