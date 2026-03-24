import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CLASSES, getStatsForLevel } from "@/lib/gameData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Sword, Shield, Heart, Zap, ChevronRight } from "lucide-react";

const statIcons = { max_hp: Heart, max_mana: Zap, attack: Sword, defense: Shield };

export default function CharacterCreate() {
  const [name, setName] = useState("");
  const [selectedClass, setSelectedClass] = useState(null);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!name.trim() || !selectedClass) return;
    setCreating(true);
    const stats = getStatsForLevel(selectedClass, 1);
    await base44.entities.Character.create({
      name: name.trim(),
      class_type: selectedClass,
      level: 1,
      xp: 0,
      xp_to_next: 100,
      ...stats,
      current_hp: stats.max_hp,
      current_mana: stats.max_mana,
      gold: 10,
      current_zone: "whispering_woods",
      inventory: [],
      equipped: {},
      quests_completed: 0,
      enemies_defeated: 0,
      story_context: "A new adventurer has arrived in the Whispering Woods, seeking glory and answers about the growing darkness.",
      unlocked_zones: ["whispering_woods"],
    });
    navigate("/game");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary to-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/20"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
            transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 5 }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl relative z-10"
      >
        <div className="text-center mb-10">
          <h1 className="font-heading text-5xl md:text-6xl font-bold text-primary tracking-wider mb-3">
            REALM OF ECHOES
          </h1>
          <p className="text-muted-foreground text-lg">Forge your legend. The story adapts to you.</p>
        </div>

        <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl shadow-primary/5">
          <div className="mb-8">
            <label className="block text-sm font-heading text-muted-foreground tracking-wider uppercase mb-2">
              Hero Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your hero's name..."
              className="bg-muted/50 border-border/50 text-foreground text-lg h-12 font-heading"
              maxLength={20}
            />
          </div>

          <div className="mb-8">
            <label className="block text-sm font-heading text-muted-foreground tracking-wider uppercase mb-4">
              Choose Your Class
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(CLASSES).map(([key, cls]) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedClass(key)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                    selectedClass === key
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                      : "border-border/40 bg-muted/30 hover:border-primary/40"
                  }`}
                >
                  <div className="text-3xl mb-2">{cls.icon}</div>
                  <div className="font-heading font-semibold text-sm">{cls.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{cls.description}</div>
                </motion.button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {selectedClass && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 overflow-hidden"
              >
                <div className="bg-muted/30 rounded-xl p-5 border border-border/30">
                  <h3 className="font-heading text-sm text-primary tracking-wider uppercase mb-3">
                    Starting Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(getStatsForLevel(selectedClass, 1)).map(([stat, val]) => {
                      const Icon = statIcons[stat];
                      return (
                        <div key={stat} className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-primary/70" />
                          <span className="text-xs text-muted-foreground capitalize">
                            {stat.replace("max_", "").replace("_", " ")}
                          </span>
                          <span className="text-sm font-semibold ml-auto">{val}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4">
                    <h4 className="text-xs font-heading text-muted-foreground uppercase tracking-wider mb-2">Abilities</h4>
                    <div className="space-y-1">
                      {CLASSES[selectedClass].abilities.map((a) => (
                        <div key={a.name} className="flex items-center gap-2 text-xs">
                          <span className="text-primary">•</span>
                          <span className="font-medium">{a.name}</span>
                          <span className="text-muted-foreground">— {a.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={handleCreate}
            disabled={!name.trim() || !selectedClass || creating}
            className="w-full h-12 font-heading text-lg tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {creating ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                Begin Your Journey
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}