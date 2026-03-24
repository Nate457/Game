import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CLASSES, getStatsForLevel } from "@/lib/gameData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sword, Shield, Heart, Zap, ChevronRight, Wind, Target, Play, ArrowLeft } from "lucide-react";

const statIcons = { 
  max_hp: Heart, 
  max_mana: Zap, 
  attack: Sword, 
  defense: Shield,
  speed: Wind,
  crit_chance: Target
};

export default function CharacterCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [selectedClass, setSelectedClass] = useState(null);
  const [creating, setCreating] = useState(false);
  const [forceNew, setForceNew] = useState(false);

  // Check if the player already has a character saved
  const { data: characters, isLoading } = useQuery({
    queryKey: ["characters"],
    queryFn: () => base44.entities.Character.list("-created_date", 1),
  });

  const existingCharacter = characters?.[0];

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

    // CRITICAL FIX: Wipe the cache so GameWorld knows the character exists!
    await queryClient.invalidateQueries({ queryKey: ["characters"] });
    
    navigate("/game");
  };

  const handleContinue = () => {
    navigate("/game");
  };

  // Show a loading spinner while checking the database
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Welcome Back / Continue Screen
  if (existingCharacter && !forceNew) {
    const cls = CLASSES[existingCharacter.class_type];
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary to-background">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <h1 className="font-heading text-5xl font-bold text-primary tracking-wider mb-2">REALM OF ECHOES</h1>
          </div>

          <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl text-center">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Welcome Back</h2>

            <div className="bg-muted/50 border border-border/50 rounded-xl p-6 mb-6">
              <div className="text-6xl mb-3">{cls?.icon}</div>
              <h3 className="font-heading text-xl font-bold text-primary mb-1">{existingCharacter.name}</h3>
              <p className="text-muted-foreground text-sm">Level {existingCharacter.level} {cls?.name}</p>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={handleContinue} className="w-full h-12 text-lg font-heading tracking-wider">
                <Play className="w-5 h-5 mr-2" fill="currentColor" />
                Continue Journey
              </Button>
              <Button onClick={() => setForceNew(true)} variant="outline" className="w-full text-muted-foreground">
                Create New Hero
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

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
        <div className="text-center mb-10 relative">
          {existingCharacter && forceNew && (
            <button 
              onClick={() => setForceNew(false)} 
              className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm font-heading"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
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
                      if (!Icon) return null;

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