import React, { useState } from "react";
import { SKILL_TREES } from "@/lib/gameData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle, ChevronDown, ChevronUp, Sparkles, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function SkillNode({ node, unlocked, canUnlock, hasPoints, onUnlock, allUnlocked }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const prereqsMet = node.prereqs.every(p => allUnlocked[p]);
  const isUnlocked = unlocked;

  const tierColors = {
    1: "border-muted-foreground/40",
    2: "border-blue-500/40",
    3: "border-purple-500/40",
    4: "border-primary/60",
  };

  const tierBg = {
    1: "bg-muted/30",
    2: "bg-blue-500/10",
    3: "bg-purple-500/10",
    4: "bg-primary/10",
  };

  return (
    <div className="relative flex flex-col items-center">
      <button
        onClick={() => {
          if (!isUnlocked && prereqsMet && hasPoints) onUnlock(node.id);
          else setShowTooltip(t => !t);
        }}
        className={`relative w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${
          isUnlocked
            ? "border-primary bg-primary/20 shadow-lg shadow-primary/20"
            : prereqsMet && hasPoints
            ? `${tierColors[node.tier]} ${tierBg[node.tier]} hover:border-primary/60 hover:scale-105 cursor-pointer`
            : "border-border/30 bg-muted/10 opacity-40 cursor-not-allowed"
        }`}
      >
        {isUnlocked && (
          <CheckCircle className="absolute -top-1.5 -right-1.5 w-4 h-4 text-primary bg-background rounded-full" />
        )}
        {!isUnlocked && !prereqsMet && (
          <Lock className="absolute -top-1.5 -right-1.5 w-3 h-3 text-muted-foreground" />
        )}
        <span className="text-xs font-semibold text-center leading-tight px-1">{node.name}</span>
        <span className="text-xs text-muted-foreground">{node.cost}pt</span>
      </button>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full mb-2 z-50 w-52 bg-card border border-border rounded-xl p-3 shadow-xl text-left"
          >
            <div className="font-heading text-sm font-bold mb-1">{node.name}</div>
            <p className="text-xs text-muted-foreground mb-2">{node.description}</p>
            <div className="text-xs text-primary">Cost: {node.cost} skill point{node.cost > 1 ? "s" : ""}</div>
            {node.prereqs.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                Requires: {node.prereqs.join(", ")}
              </div>
            )}
            {!isUnlocked && prereqsMet && hasPoints && (
              <Button
                size="sm"
                className="mt-2 w-full h-7 text-xs"
                onClick={(e) => { e.stopPropagation(); onUnlock(node.id); setShowTooltip(false); }}
              >
                Unlock
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SkillTreeView({ character, onUnlockSkill }) {
  const [activeBranch, setActiveBranch] = useState(0);
  const tree = SKILL_TREES[character?.class_type];
  if (!tree) return null;

  const unlockedSkills = character.skill_tree || {};
  const skillPoints = character.skill_points || 0;

  const branch = tree.branches[activeBranch];
  const branchNodes = tree.nodes.filter(n => n.branch === branch.id);

  // Group by tier
  const byTier = {};
  branchNodes.forEach(n => {
    if (!byTier[n.tier]) byTier[n.tier] = [];
    byTier[n.tier].push(n);
  });

  const totalUnlocked = Object.keys(unlockedSkills).filter(k => unlockedSkills[k]).length;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading text-lg font-bold">Skill Tree</h3>
          <p className="text-xs text-muted-foreground">{totalUnlocked} nodes unlocked</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-3 py-1.5">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-heading font-bold text-primary">{skillPoints}</span>
          <span className="text-xs text-muted-foreground">pts</span>
        </div>
      </div>

      {/* Branch tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tree.branches.map((b, i) => (
          <button
            key={b.id}
            onClick={() => setActiveBranch(i)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-heading font-semibold whitespace-nowrap transition-all ${
              activeBranch === i
                ? "border-primary bg-primary/15 text-primary"
                : "border-border/40 text-muted-foreground hover:border-border"
            }`}
          >
            <span>{b.icon}</span>
            {b.name}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mb-5 italic">{branch.description}</p>

      {/* Tier-by-tier nodes */}
      <div className="space-y-6">
        {Object.keys(byTier).sort().map(tier => (
          <div key={tier}>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="h-px bg-border/40 flex-1" />
              Tier {tier}
              <span className="h-px bg-border/40 flex-1" />
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {byTier[tier].map(node => (
                <SkillNode
                  key={node.id}
                  node={node}
                  unlocked={!!unlockedSkills[node.id]}
                  prereqsMet={node.prereqs.every(p => !!unlockedSkills[p])}
                  hasPoints={skillPoints >= node.cost}
                  allUnlocked={unlockedSkills}
                  onUnlock={onUnlockSkill}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}