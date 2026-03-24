import React from "react";
import { Heart, Zap, Sword, Shield, Coins, Star, BookOpen } from "lucide-react";
import { CLASSES } from "@/lib/gameData";

export default function HUD({ character }) {
  if (!character) return null;
  const cls = CLASSES[character.class_type];
  const hpPercent = Math.max(0, (character.current_hp / character.max_hp) * 100);
  const manaPercent = (character.current_mana / character.max_mana) * 100;
  const xpPercent = (character.xp / character.xp_to_next) * 100;
  const chapter = character.story_chapter || 0;

  return (
    <div className="bg-card/90 backdrop-blur-xl border-b border-border/50 px-3 py-2.5">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Character Info */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl">{cls?.icon}</span>
          <div className="min-w-0">
            <div className="font-heading font-semibold text-sm truncate leading-tight">{character.name}</div>
            <div className="text-xs text-muted-foreground leading-tight">Lv.{character.level} {cls?.name}</div>
          </div>
        </div>

        {/* HP Bar */}
        <div className="flex-1 min-w-[100px] max-w-[180px]">
          <div className="flex items-center gap-1 mb-0.5">
            <Heart className="w-3 h-3 text-red-400 flex-shrink-0" />
            <span className="text-xs text-red-300 truncate">{character.current_hp}/{character.max_hp}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500" style={{ width: `${hpPercent}%` }} />
          </div>
        </div>

        {/* Mana Bar */}
        <div className="flex-1 min-w-[100px] max-w-[160px]">
          <div className="flex items-center gap-1 mb-0.5">
            <Zap className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <span className="text-xs text-blue-300 truncate">{character.current_mana}/{character.max_mana}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500" style={{ width: `${manaPercent}%` }} />
          </div>
        </div>

        {/* XP Bar */}
        <div className="flex-1 min-w-[90px] max-w-[140px]">
          <div className="flex items-center gap-1 mb-0.5">
            <Star className="w-3 h-3 text-primary flex-shrink-0" />
            <span className="text-xs text-primary/80 truncate">{character.xp}/{character.xp_to_next} XP</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full transition-all duration-500" style={{ width: `${xpPercent}%` }} />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <div className="flex items-center gap-0.5">
            <Sword className="w-3 h-3 text-orange-400" />
            <span>{character.attack}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Shield className="w-3 h-3 text-cyan-400" />
            <span>{character.defense}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Coins className="w-3 h-3 text-primary" />
            <span>{character.gold}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <BookOpen className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Ch.{chapter}</span>
          </div>
          {(character.skill_points || 0) > 0 && (
            <div className="flex items-center gap-0.5 text-primary animate-pulse">
              <span>✦</span>
              <span>{character.skill_points}sp</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}