import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { MULTICLASS_SPECS, COOP_COMBOS } from "@/lib/coopData";
import { CLASSES as GAME_CLASSES } from "@/lib/gameData";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Plus, X, Swords, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function CoopLobby({ myCharacter, onStartCoop, onBack }) {
  const [searchName, setSearchName] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [error, setError] = useState("");

  const { data: allCharacters } = useQuery({
    queryKey: ["all_characters"],
    queryFn: () => base44.entities.Character.list("-level", 50),
    initialData: [],
  });

  const candidates = allCharacters.filter(c =>
    c.id !== myCharacter.id &&
    c.name.toLowerCase().includes(searchName.toLowerCase())
  );

  const getSpecLabel = (char) => {
    if (!char.multiclass_spec) return null;
    const spec = MULTICLASS_SPECS[char.multiclass_spec];
    return spec ? `${spec.icon} ${spec.name}` : null;
  };

  const handleStart = () => {
    if (!selectedPartner) { setError("Select a partner first!"); return; }
    onStartCoop(selectedPartner);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="font-heading text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Co-op Adventure
          </h2>
          <p className="text-xs text-muted-foreground">Find a partner and battle together</p>
        </div>
      </div>

      {/* My character card */}
      <div className="bg-card/60 border border-primary/20 rounded-xl p-4 mb-4">
        <div className="text-xs text-muted-foreground mb-1 font-heading uppercase tracking-wider">You</div>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{GAME_CLASSES[myCharacter.class_type]?.icon}</span>
          <div>
            <div className="font-heading font-bold">{myCharacter.name}</div>
            <div className="text-xs text-muted-foreground">Lv.{myCharacter.level} {GAME_CLASSES[myCharacter.class_type]?.name}</div>
            {getSpecLabel(myCharacter) && (
              <div className="text-xs text-primary/70">{getSpecLabel(myCharacter)}</div>
            )}
          </div>
        </div>
      </div>

      {/* Partner selection */}
      {!selectedPartner ? (
        <>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Search hero by name..."
              className="pl-9 bg-muted/30 border-border/40"
            />
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {candidates.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                {searchName ? "No heroes found" : "No other heroes available yet"}
              </p>
            )}
            {candidates.map(char => (
              <motion.button
                key={char.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedPartner(char)}
                className="w-full text-left bg-card/50 border border-border/30 hover:border-primary/40 hover:bg-primary/5 rounded-xl p-3 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{GAME_CLASSES[char.class_type]?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-semibold truncate">{char.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Lv.{char.level} {GAME_CLASSES[char.class_type]?.name}
                      {getSpecLabel(char) && ` • ${getSpecLabel(char)}`}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{char.enemies_defeated || 0} kills</div>
                    <div>{char.quests_completed || 0} quests</div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </>
      ) : (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Selected partner card */}
            <div className="bg-card/60 border border-green-500/30 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-green-400 font-heading uppercase tracking-wider">Partner Selected</div>
                <button onClick={() => setSelectedPartner(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{GAME_CLASSES[selectedPartner.class_type]?.icon}</span>
                <div>
                  <div className="font-heading font-bold">{selectedPartner.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Lv.{selectedPartner.level} {GAME_CLASSES[selectedPartner.class_type]?.name}
                  </div>
                  {getSpecLabel(selectedPartner) && (
                    <div className="text-xs text-primary/70">{getSpecLabel(selectedPartner)}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Synergy hint */}
            <CoopSynergyHint p1={myCharacter} p2={selectedPartner} />

            {error && <p className="text-xs text-destructive mb-2">{error}</p>}

            <Button onClick={handleStart} className="w-full h-12 bg-primary text-primary-foreground font-heading tracking-wider">
              <Swords className="w-4 h-4 mr-2" /> Start Co-op Adventure
            </Button>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function CoopSynergyHint({ p1, p2 }) {
  const p1Spec = p1.multiclass_spec || p1.class_type;
  const p2Spec = p2.multiclass_spec || p2.class_type;

  const available = COOP_COMBOS.filter(c => {
    if (c.any_class) return true;
    if (!c.class_combo) return true;
    return c.class_combo.some(([a, b]) =>
      (a === p1Spec || a === p2Spec) && (b === p2Spec || b === p1Spec)
    );
  });

  if (!available.length) return null;

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-heading text-primary uppercase tracking-wider">Combo Synergies</span>
      </div>
      <div className="space-y-1.5">
        {available.slice(0, 3).map(c => (
          <div key={c.id} className="flex items-start gap-2">
            <span className="text-base">{c.icon}</span>
            <div>
              <div className="text-xs font-semibold text-foreground">{c.name}</div>
              <div className="text-xs text-muted-foreground">{c.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}