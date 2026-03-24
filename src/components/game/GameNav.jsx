import React from "react";
import { Map, Swords, ScrollText, User, Compass, BookOpen, Trophy } from "lucide-react";

const NAV_ITEMS = [
  { id: "explore", icon: Compass, label: "Explore" },
  { id: "map", icon: Map, label: "Map" },
  { id: "quests", icon: ScrollText, label: "Quests" },
  { id: "story", icon: BookOpen, label: "Story" },
  { id: "character", icon: User, label: "Hero" },
  { id: "leaderboard", icon: Trophy, label: "Ranks" },
];


export default function GameNav({ activeTab, onTabChange, combatActive }) {
  if (combatActive) {
    return (
      <div className="bg-card/90 backdrop-blur-xl border-t border-border/50 px-2 py-2">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-destructive px-4 py-2">
            <Swords className="w-4 h-4 animate-pulse" />
            <span className="font-heading text-sm font-bold tracking-wider">IN COMBAT</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/90 backdrop-blur-xl border-t border-border/50 px-1 py-1.5">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all min-w-0 ${
              activeTab === id
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}