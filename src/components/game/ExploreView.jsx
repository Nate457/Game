import React from "react";
import { ZONES, STORY_CHAPTERS } from "@/lib/gameData";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Swords, ScrollText, Loader2, MapPin, Sparkles, BookOpen, ChevronRight, Users, X } from "lucide-react";
import { CLASSES } from "@/lib/gameData";

export default function ExploreView({ character, onStartCombat, onGenerateQuest, onAdvanceStory, isGenerating, coopPartner, onOpenCoopLobby }) {
  const zone = ZONES[character?.current_zone];
  if (!zone) return null;

  const currentChapter = character?.story_chapter || 0;
  const nextChapter = STORY_CHAPTERS[currentChapter];
  const canAdvanceStory = nextChapter && character.level >= nextChapter.min_level;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Zone Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl border border-border/50 p-5 mb-5 bg-gradient-to-br ${zone.color}`}
      >
        <div className="absolute inset-0 bg-card/55" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-heading">Current Zone</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{zone.icon}</span>
            <div>
              <h2 className="font-heading text-xl font-bold">{zone.name}</h2>
              <p className="text-sm text-muted-foreground">{zone.description}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Level Range: {zone.level_range[0]}–{zone.level_range[1]}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Story Chapter Banner */}
      {nextChapter && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`mb-4 rounded-xl border p-4 ${canAdvanceStory ? "border-primary/40 bg-primary/5" : "border-border/30 bg-muted/10"}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <BookOpen className={`w-4 h-4 flex-shrink-0 ${canAdvanceStory ? "text-primary" : "text-muted-foreground"}`} />
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Main Story — Ch.{currentChapter}</div>
                <div className={`text-sm font-heading font-semibold truncate ${canAdvanceStory ? "text-foreground" : "text-muted-foreground"}`}>
                  {nextChapter.title}
                </div>
                {!canAdvanceStory && (
                  <div className="text-xs text-destructive/70 mt-0.5">Requires Level {nextChapter.min_level}</div>
                )}
              </div>
            </div>
            <Button
              onClick={onAdvanceStory}
              disabled={isGenerating}
              size="sm"
              variant={canAdvanceStory ? "default" : "outline"}
              className={`flex-shrink-0 ${canAdvanceStory ? "bg-primary text-primary-foreground" : "opacity-50"}`}
            >
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Coop status / invite */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
        className={`mb-4 rounded-xl border p-3 flex items-center justify-between gap-2 ${coopPartner ? "border-green-500/30 bg-green-500/5" : "border-border/30 bg-muted/10"}`}>
        {coopPartner ? (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl">{CLASSES[coopPartner.class_type]?.icon}</span>
              <div className="min-w-0">
                <div className="text-xs text-green-400 font-heading uppercase tracking-wider">Co-op Active</div>
                <div className="text-sm font-semibold truncate">{coopPartner.name}</div>
                <div className="text-xs text-muted-foreground">Lv.{coopPartner.level} {CLASSES[coopPartner.class_type]?.name}</div>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => onOpenCoopLobby && onOpenCoopLobby(null)} className="flex-shrink-0 text-muted-foreground">
              <X className="w-3 h-3 mr-1" /> Leave
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Solo Adventure</span>
            </div>
            <Button size="sm" variant="outline" onClick={onOpenCoopLobby} className="flex-shrink-0 border-primary/30 text-primary hover:bg-primary/10">
              <Users className="w-3 h-3 mr-1" /> Find Partner
            </Button>
          </>
        )}
      </motion.div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Button
            onClick={onStartCombat}
            disabled={isGenerating}
            className="w-full h-14 bg-gradient-to-r from-destructive/80 to-destructive hover:from-destructive hover:to-destructive/80 text-destructive-foreground font-heading text-base tracking-wider rounded-xl shadow-lg shadow-destructive/20"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Swords className="w-5 h-5 mr-2" />}
            {isGenerating ? "Summoning..." : "Seek Battle"}
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Button
            onClick={onGenerateQuest}
            disabled={isGenerating}
            variant="outline"
            className="w-full h-14 border-primary/30 hover:bg-primary/5 font-heading text-base tracking-wider rounded-xl"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2 text-primary" />}
            {isGenerating ? "Generating..." : "Discover Side Quest"}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/50 border border-border/30 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <ScrollText className="w-4 h-4 text-primary/60" />
            <span className="font-heading text-xs text-muted-foreground uppercase tracking-wider">Story So Far</span>
          </div>
          <p className="text-sm text-foreground/70 leading-relaxed">
            {character.story_context || "Your adventure in the Realm of Echoes begins..."}
          </p>
        </motion.div>
      </div>
    </div>
  );
}