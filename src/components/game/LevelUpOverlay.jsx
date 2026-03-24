import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Star, Heart, Zap, Sword, Shield, Sparkles, Award } from "lucide-react";

export default function LevelUpOverlay({ data, onClose }) {
  if (!data) return null;

  const statItems = [
    { icon: Heart, label: "HP", value: data.stats.max_hp, color: "text-red-400" },
    { icon: Zap, label: "Mana", value: data.stats.max_mana, color: "text-blue-400" },
    { icon: Sword, label: "Attack", value: data.stats.attack, color: "text-orange-400" },
    { icon: Shield, label: "Defense", value: data.stats.defense, color: "text-cyan-400" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="w-full max-w-sm bg-card border-2 border-primary rounded-2xl p-7 text-center shadow-2xl shadow-primary/30"
        >
          <div className="relative mb-2">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-primary"
                style={{ left: "50%", top: "50%" }}
                animate={{
                  x: [0, (Math.random() - 0.5) * 180],
                  y: [0, (Math.random() - 0.5) * 180],
                  opacity: [1, 0],
                  scale: [1, 0],
                }}
                transition={{ duration: 1.5, delay: i * 0.06 }}
              />
            ))}
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2.5, ease: "linear" }}
              className="mx-auto w-fit"
            >
              <Star className="w-14 h-14 text-primary" fill="currentColor" />
            </motion.div>
          </div>

          <h2 className="font-heading text-3xl font-bold text-primary mb-0.5">Level Up!</h2>
          <p className="text-lg text-foreground font-heading mb-4">Level {data.level}</p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {statItems.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-muted/30 rounded-lg p-2.5">
                <Icon className={`w-4 h-4 mx-auto mb-0.5 ${color}`} />
                <div className="text-sm font-bold">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          {data.newSkillPoints > 0 && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg px-3 py-2 mb-3 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-heading text-primary font-bold">+{data.newSkillPoints} Skill Point{data.newSkillPoints > 1 ? "s" : ""}</span>
            </div>
          )}

          {data.newTitles?.length > 0 && (
            <div className="mb-3">
              {data.newTitles.map(t => (
                <div key={t} className="flex items-center justify-center gap-1.5 text-sm text-primary">
                  <Award className="w-4 h-4" />
                  <span className="font-heading">Title Earned: {t}</span>
                </div>
              ))}
            </div>
          )}

          <Button onClick={onClose} className="w-full bg-primary text-primary-foreground font-heading tracking-wider">
            Continue
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}