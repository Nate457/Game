import React, { useState } from "react";
import { STORY_CHAPTERS, ZONES } from "@/lib/gameData";
import { motion } from "framer-motion";
import { BookOpen, Check, Lock, ChevronRight } from "lucide-react";

const ACT_COLORS = {
  1: "text-emerald-400",
  2: "text-orange-400",
  3: "text-cyan-400",
  4: "text-purple-400",
  5: "text-blue-400",
  6: "text-primary",
};

export default function StoryJournal({ character }) {
  const [expandedAct, setExpandedAct] = useState(null);
  const currentChapter = character?.story_chapter || 0;
  const storyFlags = character?.story_flags || [];

  const acts = {};
  STORY_CHAPTERS.forEach(ch => {
    if (!acts[ch.act]) acts[ch.act] = [];
    acts[ch.act].push(ch);
  });

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-5 h-5 text-primary" />
        <div>
          <h3 className="font-heading text-lg font-bold">Story Journal</h3>
          <p className="text-xs text-muted-foreground">Chapter {currentChapter}/30 • Act {STORY_CHAPTERS[Math.min(currentChapter, 30)]?.act || 6}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Main Story Progress</span>
          <span>{Math.round((currentChapter / 30) * 100)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentChapter / 30) * 100}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>

      {/* Acts */}
      {Object.entries(acts).map(([act, chapters]) => {
        const actNum = Number(act);
        const actCompleted = chapters.every(ch => storyFlags.includes(ch.key));
        const actStarted = chapters.some(ch => storyFlags.includes(ch.key) || ch.id === currentChapter);
        const isExpanded = expandedAct === actNum;

        return (
          <div key={act} className="mb-3">
            <button
              onClick={() => setExpandedAct(isExpanded ? null : actNum)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                actStarted ? "border-border/50 bg-card/50" : "border-border/20 bg-muted/10 opacity-60"
              }`}
            >
              <div className={`font-heading text-sm font-bold ${ACT_COLORS[actNum]}`}>Act {actNum}</div>
              <div className="flex-1 text-left">
                <div className="text-xs text-muted-foreground">
                  {chapters.filter(c => storyFlags.includes(c.key)).length}/{chapters.length} chapters
                </div>
              </div>
              {actCompleted && <Check className="w-4 h-4 text-primary" />}
              {isExpanded ? <ChevronRight className="w-4 h-4 rotate-90" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="ml-4 mt-1 space-y-1"
              >
                {chapters.map(ch => {
                  const completed = storyFlags.includes(ch.key);
                  const isCurrent = ch.id === currentChapter;
                  const locked = ch.id > currentChapter && !completed;
                  const zone = ZONES[ch.zone];

                  return (
                    <div
                      key={ch.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border text-left ${
                        isCurrent ? "border-primary/40 bg-primary/5" :
                        completed ? "border-border/30 bg-card/30" :
                        "border-border/10 opacity-40"
                      }`}
                    >
                      <div className="mt-0.5">
                        {completed ? (
                          <Check className="w-4 h-4 text-primary" />
                        ) : isCurrent ? (
                          <div className="w-4 h-4 rounded-full border-2 border-primary animate-pulse" />
                        ) : (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-heading font-semibold">
                          Ch.{ch.id} — {locked ? "???" : ch.title}
                        </div>
                        {!locked && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{ch.summary}</p>
                        )}
                        {!locked && (
                          <div className="text-xs text-muted-foreground mt-1">{zone?.icon} {zone?.name}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}