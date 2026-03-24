import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ZONES, CLASSES, STORY_CHAPTERS, SIDE_QUEST_POOLS, FACTIONS,
  getStatsForLevel, xpForLevel, applySkillTreeBonuses, skillPointsForLevel
} from "@/lib/gameData";

import HUD from "@/components/game/HUD";
import GameNav from "@/components/game/GameNav";
import ExploreView from "@/components/game/ExploreView";
import WorldMap from "@/components/game/WorldMap";
import RealTimeCombat from "@/components/game/RealTimeCombat";
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
  const [currentEnemy, setCurrentEnemy] = useState(null);
  const [storyDialog, setStoryDialog] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);
  const [showCoopLobby, setShowCoopLobby] = useState(false);
  
  // NEW MULTIPLAYER STATE
  const [coopSessionId, setCoopSessionId] = useState(null);
  const [isHost, setIsHost] = useState(false);

  const sessionStartRef = useRef(Date.now());

  // ── Load character ──────────────────────────────────────────
const { data: characters, isLoading: charsLoading } = useQuery({
    queryKey: ["characters"],
    queryFn: () => base44.entities.Character.list("-created_date", 1),
  });
  const character = characters?.[0];

  // ── Load quests ─────────────────────────────────────────────
  const { data: quests } = useQuery({
    queryKey: ["quests", character?.id],
    queryFn: () => base44.entities.Quest.filter({ character_id: character.id }),
    enabled: !!character?.id,
    initialData: [],
  });

  // ── Redirect if no character ────────────────────────────────
  useEffect(() => {
    if (!charsLoading && (!characters || characters.length === 0)) {
      navigate("/");
    }
  }, [charsLoading, characters, navigate]);

  // ── Save playtime periodically ──────────────────────────────
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
    }, 60000); // every minute
    return () => clearInterval(interval);
  }, [character?.id]);

  // ── Update leaderboard ──────────────────────────────────────
  const updateLeaderboard = async (char) => {
    const existing = await base44.entities.Leaderboard.filter({ character_id: char.id });
    const payload = {
      character_id: char.id,
      character_name: char.name,
      class_type: char.class_type,
      level: char.level,
      prestige_level: char.prestige_level || 0,
      enemies_defeated: char.enemies_defeated || 0,
      quests_completed: char.quests_completed || 0,
      story_chapter: char.story_chapter || 0,
      gold: char.gold || 0,
      total_damage_dealt: char.total_damage_dealt || 0,
      titles: char.titles || [],
      deaths: char.deaths || 0,
      playtime_minutes: char.playtime_minutes || 0,
    };
    if (existing && existing.length > 0) {
      await base44.entities.Leaderboard.update(existing[0].id, payload);
    } else {
      await base44.entities.Leaderboard.create(payload);
    }
  };

  // ── Core update helper ──────────────────────────────────────
  const updateCharacter = async (data) => {
    if (!character) return;
    const updated = await base44.entities.Character.update(character.id, data);
    queryClient.invalidateQueries({ queryKey: ["characters"] });
    return updated;
  };

  // ── Unlock skill node ────────────────────────────────────────
  const handleUnlockSkill = async (nodeId) => {
    if (!character) return;
    const { SKILL_TREES } = await import("@/lib/gameData");
    const tree = SKILL_TREES[character.class_type];
    const node = tree?.nodes.find(n => n.id === nodeId);
    if (!node) return;
    if ((character.skill_points || 0) < node.cost) return;
    const newTree = { ...(character.skill_tree || {}), [nodeId]: true };
    await updateCharacter({
      skill_tree: newTree,
      skill_points: (character.skill_points || 0) - node.cost,
    });
  };

  // ── Generate main story chapter ──────────────────────────────
  const generateStoryChapter = async (chapterData) => {
    setIsGenerating(true);
    const zone = ZONES[chapterData.zone] || ZONES[character.current_zone];
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are the narrator of "Realm of Echoes", a dark fantasy RPG.

Generate the story for Chapter ${chapterData.id}: "${chapterData.title}" (Act ${chapterData.act}).
Zone: ${zone.name} (${zone.theme} theme).
Player: ${character.name}, Level ${character.level} ${CLASSES[character.class_type].name}.
Story context so far: ${character.story_context || "A new adventure begins."}
Chapter premise: ${chapterData.summary}

Write 3 paragraphs of dramatic, atmospheric narrative spoken by a storyteller/narrator voice.
Then generate a quest related to this chapter. The quest should feel like a main story mission.
Enemies to defeat: between 3-6 (higher for later chapters).
Include a meaningful item reward appropriate for level ${character.level}.
Also update the story context summary (2 sentences summarizing where the story is now).`,
      response_json_schema: {
        type: "object",
        properties: {
          narrative: { type: "string", description: "3 paragraphs of story narrative" },
          quest: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              objective: { type: "string" },
              enemies_to_defeat: { type: "number" },
              xp_reward: { type: "number" },
              gold_reward: { type: "number" },
              item_reward: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string", enum: ["weapon", "armor", "accessory"] },
                  stat_bonus: { type: "number" },
                  stat_type: { type: "string", enum: ["attack", "defense", "max_hp", "max_mana"] },
                  rarity: { type: "string", enum: ["uncommon", "rare", "epic", "legendary"] },
                  description: { type: "string" },
                },
              },
            },
          },
          story_update: { type: "string" },
          reputation_gains: {
            type: "object",
            description: "Map of faction keys to reputation amount gained (e.g. {forest_spirits: 50})",
          },
        },
      },
    });
    setIsGenerating(false);
    return result;
  };

  // ── Trigger next story chapter ───────────────────────────────
  const handleAdvanceStory = async () => {
    const currentChapter = character.story_chapter || 0;
    const nextChapterData = STORY_CHAPTERS[currentChapter];
    if (!nextChapterData) return;

    // Check min level requirement
    if (character.level < nextChapterData.min_level) {
      setStoryDialog({
        title: "Not Yet Ready",
        narrative: `The path ahead requires you to reach Level ${nextChapterData.min_level}. Train harder, gain experience, and prove your worth before facing what lies in "${nextChapterData.title}".`,
        quest: null,
        isStoryChapter: false,
      });
      return;
    }

    const result = await generateStoryChapter(nextChapterData);

    setStoryDialog({
      title: `Chapter ${currentChapter}: ${nextChapterData.title}`,
      narrative: result.narrative,
      quest: result.quest,
      story_update: result.story_update,
      isStoryChapter: true,
      chapterId: currentChapter,
      chapterKey: nextChapterData.key,
      reputation_gains: result.reputation_gains,
    });
  };

  // ── Generate side quest ──────────────────────────────────────
  const generateQuest = async () => {
    setIsGenerating(true);
    const zone = ZONES[character.current_zone];
    const pool = SIDE_QUEST_POOLS[character.current_zone] || [];
    const completedSideQuests = character.side_quest_flags || [];
    const available = pool.filter(q => !completedSideQuests.includes(q));
    const questTitle = available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : null;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an NPC quest giver in "Realm of Echoes".
Zone: ${zone.name} (${zone.theme}).
Player: ${character.name}, Level ${character.level} ${CLASSES[character.class_type].name}.
Story so far: ${character.story_context || "A new adventure begins."}
${questTitle ? `Quest theme: "${questTitle}"` : "Create a new side quest that fits the zone."}
Quests completed: ${character.quests_completed}. Side quests completed: ${completedSideQuests.length}.

Write 2-3 paragraphs of dialogue as an NPC who gives this side quest. Make it feel personal, atmospheric, and connected to the world. Side quests should spiral and feel like they could lead somewhere bigger.
The enemies to defeat should be between 2-5.
Item reward appropriate for level ${character.level}.
Also include faction reputation to gain (50-200 depending on quest importance).`,
      response_json_schema: {
        type: "object",
        properties: {
          narrative: { type: "string" },
          npc_name: { type: "string" },
          quest: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              objective: { type: "string" },
              enemies_to_defeat: { type: "number" },
              xp_reward: { type: "number" },
              gold_reward: { type: "number" },
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
            },
          },
          story_update: { type: "string" },
          faction_key: { type: "string", description: "Which faction this quest is for" },
          reputation_gain: { type: "number" },
        },
      },
    });

    setIsGenerating(false);
    setStoryDialog({
      title: result.quest?.title || "A New Quest",
      narrative: result.narrative,
      npc_name: result.npc_name,
      quest: result.quest,
      story_update: result.story_update,
      isStoryChapter: false,
      questTitleKey: questTitle,
      faction_key: result.faction_key,
      reputation_gain: result.reputation_gain,
    });
  };

  // ── Generate enemy ───────────────────────────────────────────
  const generateEnemy = async () => {
    setIsGenerating(true);
    const zone = ZONES[character.current_zone];
    const minLvl = Math.max(zone.level_range[0], character.level - 1);
    const maxLvl = Math.min(zone.level_range[1], character.level + 2);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a unique enemy for "${zone.name}" (${zone.theme} theme).
Enemy themes: ${zone.enemies_theme}.
Player: Level ${character.level} ${CLASSES[character.class_type].name}.
Context: ${character.story_context || "Adventure begins."}
Enemies defeated so far: ${character.enemies_defeated}.
Chapter: ${character.story_chapter || 0}/30.

Be creative — give the enemy personality, lore, and a memorable battle cry. Not generic.
Enemy level: ${minLvl}-${maxLvl}.
Use a single emoji for the icon.`,
      response_json_schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          icon: { type: "string" },
          level: { type: "number" },
          hp: { type: "number", description: `${50 + minLvl * 18}-${70 + maxLvl * 25}` },
          attack: { type: "number", description: `${6 + minLvl * 2}-${9 + maxLvl * 3}` },
          defense: { type: "number", description: `${3 + minLvl}-${5 + maxLvl * 2}` },
          xp_reward: { type: "number", description: `${25 + minLvl * 10}-${35 + maxLvl * 15}` },
          gold_reward: { type: "number", description: `${6 + minLvl * 4}-${12 + maxLvl * 6}` },
          lore: { type: "string" },
          battle_cry: { type: "string" },
        },
      },
    });

    setIsGenerating(false);
    setCurrentEnemy(result);
    setActiveTab("combat");
  };

  // ── Accept quest (from dialog) ───────────────────────────────
  const acceptQuest = async (quest) => {
    const dialog = storyDialog;

    // Create quest record
    await base44.entities.Quest.create({
      character_id: character.id,
      title: quest.title,
      description: quest.description,
      objective: quest.objective,
      zone: character.current_zone,
      enemies_to_defeat: quest.enemies_to_defeat || 3,
      enemies_defeated: 0,
      xp_reward: quest.xp_reward,
      gold_reward: quest.gold_reward,
      item_reward: quest.item_reward,
      status: "active",
      story_text: dialog?.narrative,
    });

    // Update story state
    const characterUpdates = {};

    if (dialog?.story_update) characterUpdates.story_context = dialog.story_update;

    // Advance story chapter if this is a story quest
    if (dialog?.isStoryChapter && dialog?.chapterId !== undefined) {
      characterUpdates.story_chapter = dialog.chapterId + 1;
      const storyFlags = [...(character.story_flags || [])];
      if (dialog.chapterKey && !storyFlags.includes(dialog.chapterKey)) {
        storyFlags.push(dialog.chapterKey);
      }
      characterUpdates.story_flags = storyFlags;

      // Maybe unlock zone based on chapter
      const nextChapterZone = STORY_CHAPTERS[dialog.chapterId + 1]?.zone;
      if (nextChapterZone && !( character.unlocked_zones || ["whispering_woods"]).includes(nextChapterZone)) {
        const unlockedZones = [...(character.unlocked_zones || ["whispering_woods"])];
        const zoneData = ZONES[nextChapterZone];
        if (zoneData && character.level >= (zoneData.unlock_level || 0)) {
          unlockedZones.push(nextChapterZone);
          characterUpdates.unlocked_zones = unlockedZones;
          characterUpdates.current_zone = nextChapterZone;
        }
      }
    }

    // Track side quest
    if (!dialog?.isStoryChapter && dialog?.questTitleKey) {
      const sideFlags = [...(character.side_quest_flags || [])];
      if (!sideFlags.includes(dialog.questTitleKey)) sideFlags.push(dialog.questTitleKey);
      characterUpdates.side_quest_flags = sideFlags;
    }

    // Apply reputation gains
    if (dialog?.reputation_gains || (dialog?.faction_key && dialog?.reputation_gain)) {
      const rep = { ...(character.reputation || {}) };
      if (dialog.reputation_gains) {
        Object.entries(dialog.reputation_gains).forEach(([fk, amount]) => {
          rep[fk] = (rep[fk] || 0) + amount;
        });
      } else if (dialog.faction_key) {
        rep[dialog.faction_key] = (rep[dialog.faction_key] || 0) + (dialog.reputation_gain || 50);
      }
      characterUpdates.reputation = rep;
    }

    if (Object.keys(characterUpdates).length > 0) {
      await updateCharacter(characterUpdates);
    }

    queryClient.invalidateQueries({ queryKey: ["quests"] });
    setStoryDialog(null);
    setActiveTab("quests");
  };

  // ── Handle multiclass spec selection ────────────────────────
  const handleSelectSpec = async (specId) => {
    await updateCharacter({ multiclass_spec: specId });
  };

  // ── Start coop ──────────────────────────────────────────────
const handleJoinSession = (sessionId, hostStatus) => {
    setCoopSessionId(sessionId);
    setIsHost(hostStatus);
    setShowCoopLobby(false);
    setActiveTab("combat"); // Drop them right into the waiting arena
  };

  // ── Handle combat end ────────────────────────────────────────
  const handleCombatEnd = async ({ victory, playerHp, playerMana, p2Hp, p2Mana, totalDamage, combosPerformed = 0, coopCombosPerformed = 0 }) => {
    if (!victory) {
      const newDeaths = (character.deaths || 0) + 1;
      await updateCharacter({
        current_hp: Math.floor(character.max_hp * 0.5),
        current_mana: Math.floor(character.max_mana * 0.5),
        deaths: newDeaths,
      });
      setCurrentEnemy(null);
      setActiveTab("explore");
      return;
    }

    const enemy = currentEnemy;
    const boostedStats = applySkillTreeBonuses(
      { attack: character.attack, defense: character.defense, max_hp: character.max_hp, max_mana: character.max_mana, speed: character.speed, crit_chance: character.crit_chance },
      character.class_type, character.skill_tree
    );

    const goldMultiplier = 1 + (boostedStats.gold_bonus || 0);
    const xpMultiplier = 1 + (boostedStats.xp_bonus || 0);

    let newXp = character.xp + Math.round(enemy.xp_reward * xpMultiplier);
    let newLevel = character.level;
    let newXpToNext = character.xp_to_next;
    let didLevelUp = false;
    let newSkillPoints = character.skill_points || 0;

    // Level up loop
    while (newXp >= newXpToNext) {
      newXp -= newXpToNext;
      newLevel++;
      newXpToNext = xpForLevel(newLevel);
      newSkillPoints += skillPointsForLevel(newLevel);
      didLevelUp = true;
    }

    const newStats = didLevelUp ? getStatsForLevel(character.class_type, newLevel) : {};

    // Zone reputation gain
    const zone = ZONES[character.current_zone];
    const zoneRep = { ...(character.reputation || {}) };
    if (zone.faction) zoneRep[zone.faction] = (zoneRep[zone.faction] || 0) + 5;

    // Zone unlocks based on new level
    const unlockedZones = [...(character.unlocked_zones || ["whispering_woods"])];
    Object.entries(ZONES).forEach(([zoneKey, z]) => {
      if (!unlockedZones.includes(zoneKey) && z.unlock_level && newLevel >= z.unlock_level) {
        unlockedZones.push(zoneKey);
      }
    });

    // Check titles
    const titles = [...(character.titles || [])];
    const newKills = (character.enemies_defeated || 0) + 1;
    if (newKills >= 10 && !titles.includes("Slayer")) titles.push("Slayer");
    if (newKills >= 50 && !titles.includes("Veteran")) titles.push("Veteran");
    if (newKills >= 100 && !titles.includes("Champion")) titles.push("Champion");
    if (newKills >= 250 && !titles.includes("Warlord")) titles.push("Warlord");
    if (newLevel >= 10 && !titles.includes("Seasoned")) titles.push("Seasoned");
    if (newLevel >= 20 && !titles.includes("Elite")) titles.push("Elite");

    // Quest progress
    const activeQuests = (quests || []).filter(q => q.status === "active" && q.zone === character.current_zone);
    let extraXp = 0;
    let extraGold = 0;
    let newInventory = [...(character.inventory || [])];
    let questsCompletedDelta = 0;

    for (const quest of activeQuests) {
      const newDefeated = (quest.enemies_defeated || 0) + 1;
      if (newDefeated >= quest.enemies_to_defeat) {
        await base44.entities.Quest.update(quest.id, { enemies_defeated: newDefeated, status: "completed" });
        extraXp += Math.round(quest.xp_reward * xpMultiplier);
        extraGold += Math.round(quest.gold_reward * goldMultiplier);
        questsCompletedDelta++;
        if (quest.item_reward?.name) newInventory.push(quest.item_reward);
      } else {
        await base44.entities.Quest.update(quest.id, { enemies_defeated: newDefeated });
      }
    }

    // Re-check level up from quest XP
    if (extraXp > 0) {
      newXp += extraXp;
      while (newXp >= newXpToNext) {
        newXp -= newXpToNext;
        newLevel++;
        newXpToNext = xpForLevel(newLevel);
        newSkillPoints += skillPointsForLevel(newLevel);
        didLevelUp = true;
      }
    }

    const finalStats = didLevelUp ? getStatsForLevel(character.class_type, newLevel) : {};

    const updatedCharacter = {
      xp: newXp,
      level: newLevel,
      xp_to_next: newXpToNext,
      gold: Math.round((character.gold || 0) + enemy.gold_reward * goldMultiplier + extraGold),
      current_hp: didLevelUp ? finalStats.max_hp : playerHp,
      current_mana: didLevelUp ? finalStats.max_mana : playerMana,
      enemies_defeated: newKills,
      quests_completed: (character.quests_completed || 0) + questsCompletedDelta,
      total_damage_dealt: (character.total_damage_dealt || 0) + (totalDamage || 0),
      unlocked_zones: unlockedZones,
      inventory: newInventory,
      skill_points: newSkillPoints,
      reputation: zoneRep,
      titles,
      combos_performed: (character.combos_performed || 0) + (combosPerformed || 0),
      coop_combos_performed: (character.coop_combos_performed || 0) + (coopCombosPerformed || 0),
      ...(didLevelUp ? finalStats : {}),
    };

    await updateCharacter(updatedCharacter);

    // Update leaderboard asynchronously
    updateLeaderboard({ ...character, ...updatedCharacter }).catch(console.error);

    queryClient.invalidateQueries({ queryKey: ["quests"] });

    if (didLevelUp) {
      setLevelUpData({
        level: newLevel,
        stats: getStatsForLevel(character.class_type, newLevel),
        newTitles: titles.filter(t => !(character.titles || []).includes(t)),
        newSkillPoints: newSkillPoints - (character.skill_points || 0),
      });
    }

    setCurrentEnemy(null);
    setActiveTab("explore");
  };

  const handleSelectZone = async (zoneKey) => {
    await updateCharacter({ current_zone: zoneKey });
    setActiveTab("explore");
  };

  const handleFlee = async () => {
    await updateCharacter({
      current_hp: Math.max(1, character.current_hp - Math.floor(character.max_hp * 0.1)),
    });
    setCurrentEnemy(null);
    setActiveTab("explore");
  };

  if (charsLoading || !character) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <HUD character={character} />

      <div className="flex-1 overflow-y-auto">
        {activeTab === "combat" ? (
          <RealTimeCombat
            character={character}
            enemyData={currentEnemy}
            sessionId={coopSessionId}
            isHost={isHost}
            onCombatEnd={handleCombatEnd}
            onFlee={handleFlee}
          />
        ) : showCoopLobby ? (
          <CoopLobby
            myCharacter={character}
            onJoinSession={handleJoinSession}
            onBack={() => setShowCoopLobby(false)}
          />
        ) : activeTab === "explore" ? (
          <ExploreView
            character={character}
            onStartCombat={generateEnemy}
            onGenerateQuest={generateQuest}
            onAdvanceStory={handleAdvanceStory}
            isGenerating={isGenerating}
            coopPartner={coopPartner}
            onOpenCoopLobby={(partner) => {
              if (partner === null) { setCoopPartner(null); } else { setShowCoopLobby(true); }
            }}
          />
        ) : activeTab === "map" ? (
          <WorldMap character={character} onSelectZone={handleSelectZone} />
        ) : activeTab === "quests" ? (
          <QuestLog quests={quests} />
        ) : activeTab === "story" ? (
          <StoryJournal character={character} />
        ) : activeTab === "character" ? (
          <CharacterPanel character={character} onUnlockSkill={handleUnlockSkill} onSelectSpec={handleSelectSpec} />
        ) : activeTab === "leaderboard" ? (
          <LeaderboardView currentCharacter={character} />
        ) : null}
      </div>

      <GameNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        combatActive={!!currentEnemy}
      />

      <StoryDialog
        story={storyDialog}
        onClose={() => setStoryDialog(null)}
        onAcceptQuest={acceptQuest}
      />

      <LevelUpOverlay data={levelUpData} onClose={() => setLevelUpData(null)} />
    </div>
  );
}