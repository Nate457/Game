import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CLASSES } from "@/lib/gameData";
import { Trophy, Skull, Swords, ScrollText, Star, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const RANK_STYLES = [
  "text-primary border-primary/30 bg-primary/10",
  "text-slate-300 border-slate-400/30 bg-slate-500/10",
  "text-amber-600 border-amber-600/30 bg-amber-600/10",
];

function StatPill({ icon: Icon, value, color }) {
  return (
    <div className={`flex items-center gap-1 text-xs ${color}`}>
      <Icon className="w-3 h-3" />
      <span>{value}</span>
    </div>
  );
}

export default function LeaderboardView({ currentCharacter }) {
  const { data: entries, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => base44.entities.Leaderboard.list("-level", 50),
    initialData: [],
    refetchInterval: 30000,
  });

  const sortedEntries = [...(entries || [])].sort((a, b) => {
    // Sort by prestige → level → enemies defeated
    if (b.prestige_level !== a.prestige_level) return (b.prestige_level || 0) - (a.prestige_level || 0);
    if (b.level !== a.level) return (b.level || 0) - (a.level || 0);
    return (b.enemies_defeated || 0) - (a.enemies_defeated || 0);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="font-heading text-2xl font-bold text-primary tracking-wider flex items-center justify-center gap-2">
          <Trophy className="w-6 h-6" /> Hall of Heroes
        </h2>
        <p className="text-muted-foreground text-sm mt-1">{sortedEntries.length} adventurers recorded</p>
      </div>

      {sortedEntries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-heading">No heroes yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedEntries.map((entry, idx) => {
            const cls = CLASSES[entry.class_type];
            const isYou = entry.character_id === currentCharacter?.id;
            const rankStyle = idx < 3 ? RANK_STYLES[idx] : "text-muted-foreground border-border/30";

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  isYou ? "border-primary/40 bg-primary/5" : "border-border/30 bg-card/50"
                }`}
              >
                {/* Rank */}
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-heading font-bold ${rankStyle}`}>
                  {idx === 0 ? "👑" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                </div>

                {/* Avatar & Name */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xl">{cls?.icon || "⚔️"}</span>
                  <div className="min-w-0">
                    <div className="font-heading text-sm font-semibold truncate flex items-center gap-1">
                      {entry.character_name}
                      {isYou && <Badge className="text-xs py-0 h-4">You</Badge>}
                      {(entry.prestige_level || 0) > 0 && (
                        <span className="text-primary text-xs">✦{entry.prestige_level}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">Lv.{entry.level} {cls?.name}</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-col gap-0.5 items-end">
                  <StatPill icon={Swords} value={entry.enemies_defeated || 0} color="text-orange-400" />
                  <StatPill icon={ScrollText} value={`Ch.${entry.story_chapter || 0}`} color="text-blue-400" />
                  <StatPill icon={Skull} value={`${entry.deaths || 0}💀`} color="text-muted-foreground" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}