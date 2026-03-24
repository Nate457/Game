import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollText, X } from "lucide-react";

export default function StoryDialog({ story, onClose, onAcceptQuest }) {
  if (!story) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-secondary to-muted p-4 flex items-center gap-3">
            <ScrollText className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold tracking-wider text-primary">
              {story.title || "A New Chapter"}
            </h3>
            <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
              {story.narrative}
            </p>

            {story.quest && (
              <div className="bg-muted/50 border border-primary/20 rounded-xl p-4 mt-4">
                <h4 className="font-heading text-sm text-primary font-semibold mb-1">
                  Quest: {story.quest.title}
                </h4>
                <p className="text-xs text-muted-foreground mb-2">{story.quest.description}</p>
                <p className="text-xs text-foreground/70">
                  Objective: <span className="text-foreground">{story.quest.objective}</span>
                </p>
                <div className="flex gap-3 text-xs text-muted-foreground mt-2">
                  <span>🏆 {story.quest.xp_reward} XP</span>
                  <span>💰 {story.quest.gold_reward} Gold</span>
                  {story.quest.item_reward && (
                    <span className="text-primary">🎁 {story.quest.item_reward.name}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose} size="sm">
              Dismiss
            </Button>
            {story.quest && onAcceptQuest && (
              <Button onClick={() => onAcceptQuest(story.quest)} size="sm" className="bg-primary text-primary-foreground">
                Accept Quest
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}