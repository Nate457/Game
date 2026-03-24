import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollText, CheckCircle2, Target, Coins, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function QuestLog({ quests }) {
  const activeQuests = quests.filter(q => q.status === "active");
  const completedQuests = quests.filter(q => q.status === "completed");

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <ScrollText className="w-5 h-5 text-primary" />
        <h2 className="font-heading text-xl font-bold text-primary tracking-wider">Quest Log</h2>
      </div>

      {activeQuests.length === 0 && completedQuests.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No quests yet. Explore the world to find adventures!</p>
        </div>
      )}

      {activeQuests.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-heading text-muted-foreground uppercase tracking-wider mb-3">
            Active ({activeQuests.length})
          </h3>
          <div className="space-y-3">
            {activeQuests.map((quest) => (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/80 border border-primary/20 rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-heading font-semibold text-sm">{quest.title}</h4>
                  <Badge variant="outline" className="text-primary border-primary/30 text-xs">Active</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{quest.description}</p>
                
                <div className="flex items-center gap-1 text-xs mb-2">
                  <Target className="w-3 h-3 text-accent" />
                  <span className="text-foreground/80">{quest.objective}</span>
                </div>

                {quest.enemies_to_defeat > 0 && (
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(quest.enemies_defeated / quest.enemies_to_defeat) * 100}%` }}
                    />
                  </div>
                )}

                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" />{quest.xp_reward} XP</span>
                  <span className="flex items-center gap-1"><Coins className="w-3 h-3" />{quest.gold_reward} Gold</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {completedQuests.length > 0 && (
        <div>
          <h3 className="text-sm font-heading text-muted-foreground uppercase tracking-wider mb-3">
            Completed ({completedQuests.length})
          </h3>
          <div className="space-y-2">
            {completedQuests.map((quest) => (
              <div
                key={quest.id}
                className="bg-muted/30 border border-border/30 rounded-xl p-3 flex items-center gap-3"
              >
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <div className="min-w-0">
                  <div className="font-heading text-xs font-semibold truncate">{quest.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{quest.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}