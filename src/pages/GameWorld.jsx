import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ZONES, CLASSES, STORY_CHAPTERS, SIDE_QUEST_POOLS, FACTIONS,
  getStatsForLevel, xpForLevel, applySkillTreeBonuses, skillPointsForLevel
} from "@/lib/gameData";
import { X, Loader2 } from "lucide-react";

import HUD from "@/components/game/HUD";
import GameNav from "@/components/game/GameNav";
import OpenWorld from "@/components/game/OpenWorld";
import WorldMap from "@/components/game/WorldMap";
import QuestLog from "@/components/game/QuestLog";
import CharacterPanel from "@/components/game/CharacterPanel";
import StoryDialog from "@/components/game/StoryDialog";
import LevelUpOverlay from "@/components/game/LevelUpOverlay";
import StoryJournal from "@/components/game/StoryJournal";
import LeaderboardView from "@/components/game/LeaderboardView";
import CoopLobby from "@/components/game/CoopLobby";

export default function GameWorld() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("explore"); 
  const [storyDialog, setStoryDialog] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);
  const [showCoopLobby, setShowCoopLobby] = useState(false);
  
  const [coopSessionId, setCoopSessionId] = useState(null);
  const [isHost, setIsHost] = useState(false);

  const sessionStartRef = useRef(Date.now());

  // ── Load character ──────────────────────────────────────────
  const { data: characters, isLoading: charsLoading } = useQuery({
    queryKey: ["characters"],
    queryFn: () => base44.entities.Character.list("-created_date", 1),
  });
  const character = characters?.[0];

  const { data: quests } = useQuery({
    queryKey: ["quests", character?.id],
    queryFn: () => base44.entities.Quest.filter({ character_id: character?.id }),
    enabled: !!character?.id,
    initialData: [],
  });

  useEffect(() => {
    if (!charsLoading && (!characters || characters.length === 0)) navigate("/");
  }, [charsLoading, characters, navigate]);

  useEffect(() => {
    if (!character?.id) return;
    const interval = setInterval(async () => {
      const minutesElapsed = Math.round((Date.now() - sessionStartRef.current) / 60000);
      if (minutesElapsed > 0) {
        await base44.entities.Character.update(character.id, {
          last_active: new Date().toISOString(),
          playtime_minutes: (character.playtime_minutes || 0) + minutesElapsed,
        });
        sessionStartRef.current = Date.now();
        queryClient.invalidateQueries({ queryKey: ["characters"] });
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [character?.id]);

  const updateCharacter = async (data) => {
    if (!character) return;
    await base44.entities.Character.update(character.id, data);
    queryClient.invalidateQueries({ queryKey: ["characters"] });
  };

  const handleLeaveCoop = async () => {
    if (!coopSessionId) return;
    const currentId = coopSessionId;
    setCoopSessionId(null); 
    if (isHost) {
      try { await base44.entities.CoopSession.delete(currentId); } catch (e) { console.error(e); }
    } else {
      try { await base44.entities.CoopSession.update(currentId, { guest: null, guest_pos: null }); } catch (e) { console.error(e); }
    }
  };

  const handleEnemyDefeated = async (enemy, damageDealt) => {
    const boostedStats = applySkillTreeBonuses(
      { attack: character.attack, defense: character.defense, max_hp: character.max_hp, max_mana: character.max_mana, speed: character.speed, crit_chance: character.crit_chance },
      character.class_type, character.skill_tree
    );

    const goldMult = 1 + (boostedStats.gold_bonus || 0);
    const xpMult = 1 + (boostedStats.xp_bonus || 0);

    let newXp = character.xp + Math.round(enemy.xp_reward * xpMult);
    let newLevel = character.level;
    let newXpToNext = character.xp_to_next;
    let didLevelUp = false;
    let newSkillPts = character.skill_points || 0;

    while (newXp >= newXpToNext) {
      newXp -= newXpToNext;
      newLevel++;
      newXpToNext = xpForLevel(newLevel);
      newSkillPts += skillPointsForLevel(newLevel);
      didLevelUp = true;
    }

    const newStats = didLevelUp ? getStatsForLevel(character.class_type, newLevel) : {};
    
    const activeQuests = (quests || []).filter(q => q.status === "active" && q.zone === character.current_zone);
    for (const quest of activeQuests) {
      const newDefeated = (quest.enemies_defeated || 0) + 1;
      if (newDefeated >= quest.enemies_to_defeat) {
        await base44.entities.Quest.update(quest.id, { enemies_defeated: newDefeated, status: "completed" });
      } else {
        await base44.entities.Quest.update(quest.id, { enemies_defeated: newDefeated });
      }
    }

    await updateCharacter({
      xp: newXp, level: newLevel, xp_to_next: newXpToNext,
      gold: Math.round((character.gold || 0) + enemy.gold_reward * goldMult),
      enemies_defeated: (character.enemies_defeated || 0) + 1,
      total_damage_dealt: (character.total_damage_dealt || 0) + damageDealt,
      skill_points: newSkillPts,
      ...newStats
    });

    queryClient.invalidateQueries({ queryKey: ["quests"] });

    if (didLevelUp) {
      setLevelUpData({
        level: newLevel,
        stats: getStatsForLevel(character.class_type, newLevel),
        newSkillPoints: newSkillPts - (character.skill_points || 0),
      });
    }
  };

  const spawnEnemyLLM = async () => {
    const zone = ZONES[character.current_zone];
    const minLvl = Math.max(zone.level_range[0], character.level - 1);
    const maxLvl = Math.min(zone.level_range[1], character.level + 2);

    return await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a unique enemy for "${zone.name}" (${zone.theme} theme). Player is Lv ${character.level}. Enemy level: ${minLvl}-${maxLvl}. Use single emoji for icon.`,
      response_json_schema: {
        type: "object",
        properties: {
          name: { type: "string" }, icon: { type: "string" }, level: { type: "number" },
          hp: { type: "number", description: `${50 + minLvl * 18}-${70 + maxLvl * 25}` },
          attack: { type: "number", description: `${6 + minLvl * 2}-${9 + maxLvl * 3}` },
          defense: { type: "number", description: `${3 + minLvl}-${5 + maxLvl * 2}` },
          xp_reward: { type: "number" }, gold_reward: { type: "number" }, battle_cry: { type: "string" },
        },
      },
    });
  };

  const generateQuest = async () => {
    setIsGenerating(true);
    try {
      const zone = ZONES[character.current_zone];
      const result = await base44.integrations.Core.InvokeLLM({
        // FIX: Re-added the character's memory context to the AI so it stays internally consistent
        prompt: `You are an NPC in ${zone.name}. Player is Lv ${character.level}. 
Story context so far: ${character.story_context || "A new adventure begins."}
Generate a short side quest dialogue and quest data. Include a 'story_update' field that summarizes the story so far and seamlessly includes this new encounter, so you remember it next time.`,
        response_json_schema: {
          type: "object",
          properties: {
            narrative: { type: "string" }, npc_name: { type: "string" },
            story_update: { type: "string" }, // FIX: Save AI memory
            quest: {
              type: "object",
              properties: {
                title: { type: "string" }, description: { type: "string" }, objective: { type: "string" },
                enemies_to_defeat: { type: "number" }, xp_reward: { type: "number" }, gold_reward: { type: "number" },
                item_reward: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    type: { type: "string", enum: ["weapon", "armor", "accessory"] },
                    stat_bonus: { type: "number" },
                    stat_type: { type: "string", enum: ["attack", "defense", "max_hp", "max_mana"] },
                    rarity: { type: "string", enum: ["common", "uncommon", "rare", "epic"] },
                    description: { type: "string" },
                  },
                },
              }
            }
          }
        }
      });
      setStoryDialog({ ...result, isStoryChapter: false });
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("The AI failed to generate the quest. Please try talking to them again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAdvanceStory = async () => {
    const currentChapter = character.story_chapter || 0;
    const nextChapterData = STORY_CHAPTERS[currentChapter];
    if (!nextChapterData) return;

    if (character.level < nextChapterData.min_level) {
      setStoryDialog({
        title: "Not Yet Ready",
        narrative: `The path ahead requires you to reach Level ${nextChapterData.min_level}. Train harder, gain experience, and prove your worth before facing what lies in "${nextChapterData.title}".`,
        quest: null,
        isStoryChapter: false,
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        // FIX: Passing the full story memory
        prompt: `Generate narrative for Chapter ${nextChapterData.id}: "${nextChapterData.title}". Player Lv ${character.level}.
Story context so far: ${character.story_context || "A new adventure begins."}
Continue the story logically from the context. Generate a main quest, and a 'story_update' summarizing the ENTIRE story so far including this new chapter so you don't forget previous events.`,
        response_json_schema: {
          type: "object",
          properties: {
            narrative: { type: "string" }, story_update: { type: "string" },
            quest: {
              type: "object",
              properties: { 
                title: { type: "string" }, description: { type: "string" }, objective: { type: "string" }, 
                enemies_to_defeat: { type: "number" }, xp_reward: { type: "number" }, gold_reward: { type: "number" },
                item_reward: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    type: { type: "string", enum: ["weapon", "armor", "accessory"] },
                    stat_bonus: { type: "number" },
                    stat_type: { type: "string", enum: ["attack", "defense", "max_hp", "max_mana"] },
                    rarity: { type: "string", enum: ["common", "uncommon", "rare", "epic", "legendary"] },
                    description: { type: "string" },
                  },
                }
              }
            }
          }
        }
      });
      setStoryDialog({ ...result, title: `Chapter ${currentChapter}: ${nextChapterData.title}`, isStoryChapter: true, chapterId: currentChapter, chapterKey: nextChapterData.key });
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("The AI narrator lost its train of thought. Please click the story NPC to try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const acceptQuest = async (quest) => {
    await base44.entities.Quest.create({
      character_id: character.id, title: quest.title, description: quest.description, objective: quest.objective,
      zone: character.current_zone, enemies_to_defeat: quest.enemies_to_defeat || 3, enemies_defeated: 0,
      xp_reward: quest.xp_reward, gold_reward: quest.gold_reward, status: "active",
    });

    const updates = {};
    // FIX: Update character's AI memory for BOTH Side Quests and Story Chapters
    if (storyDialog.story_update) {
      updates.story_context = storyDialog.story_update;
    }
    if (storyDialog.isStoryChapter) {
      updates.story_chapter = storyDialog.chapterId + 1;
    }

    if (Object.keys(updates).length > 0) {
      await updateCharacter(updates);
    }

    // FIX: Invalidate the cache so the UI actually refreshes to show the new quest
    queryClient.invalidateQueries({ queryKey: ["quests"] });
    
    setStoryDialog(null);
    setActiveTab("quests");
  };

  if (charsLoading || !character) return <div className="fixed inset-0 flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10" /></div>;

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 relative flex flex-col">
      <div className="absolute inset-0 z-0">
        <OpenWorld 
          character={character} 
          sessionId={coopSessionId} 
          isHost={isHost}
          onEnemyDefeated={handleEnemyDefeated}
          onGenerateQuest={generateQuest}
          onAdvanceStory={handleAdvanceStory}
          spawnEnemyLLM={spawnEnemyLLM}
          isGenerating={isGenerating}
          onOpenCoopLobby={() => setShowCoopLobby(true)}
          onLeaveCoop={handleLeaveCoop}
        />
      </div>

      <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none">
        <div className="pointer-events-auto"><HUD character={character} /></div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-40 pointer-events-none">
        <div className="pointer-events-auto"><GameNav activeTab={activeTab} onTabChange={setActiveTab} combatActive={false} /></div>
      </div>

      <AnimatePresence>
        {activeTab !== "explore" && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex justify-center pt-24 pb-28 px-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-4xl bg-card border border-border/50 rounded-2xl shadow-2xl relative h-fit min-h-[50vh] pointer-events-auto"
            >
              <button onClick={() => setActiveTab("explore")} className="absolute top-4 right-4 text-muted-foreground hover:text-white z-50">
                <X className="w-6 h-6" />
              </button>

              {activeTab === "map" && <WorldMap character={character} onSelectZone={(z) => { updateCharacter({ current_zone: z }); setActiveTab("explore"); }} />}
              {activeTab === "quests" && <QuestLog quests={quests} />}
              {activeTab === "story" && <StoryJournal character={character} />}
              {activeTab === "character" && <CharacterPanel character={character} onUnlockSkill={async (id) => { }} onSelectSpec={async (id) => updateCharacter({ multiclass_spec: id })} />}
              {activeTab === "leaderboard" && <LeaderboardView currentCharacter={character} />}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showCoopLobby && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
          <CoopLobby 
            myCharacter={character} 
            onJoinSession={(id, host) => { setCoopSessionId(id); setIsHost(host); setShowCoopLobby(false); setActiveTab("explore"); }} 
            onBack={() => setShowCoopLobby(false)} 
          />
        </div>
      )}

      <StoryDialog story={storyDialog} onClose={() => setStoryDialog(null)} onAcceptQuest={acceptQuest} />
      <LevelUpOverlay data={levelUpData} onClose={() => setLevelUpData(null)} />
    </div>
  );
}