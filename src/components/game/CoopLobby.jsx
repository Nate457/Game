import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Users, ArrowLeft, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CoopLobby({ myCharacter, onJoinSession, onBack }) {
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [myHostedCode, setMyHostedCode] = useState(null);

  const handleHostGame = async () => {
    setLoading(true);
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    try {
      const session = await base44.entities.CoopSession.create({
        code,
        status: "lobby",
        host: { 
          id: myCharacter.id, name: myCharacter.name, class: myCharacter.class_type,
          hp: myCharacter.max_hp, max_hp: myCharacter.max_hp, x: 100, y: 200, tx: 100, ty: 200 
        },
        guest: null,
        enemy: null
      });
      setMyHostedCode(code);
      onJoinSession(session.id, true); // True = isHost
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleJoinGame = async () => {
    if (!joinCode) return;
    setLoading(true);
    try {
      const session = await base44.entities.CoopSession.getByCode(joinCode);
      if (!session) throw new Error("Room not found!");
      if (session.guest) throw new Error("Room is full!");
      
      await base44.entities.CoopSession.update(session.id, {
        guest: { 
          id: myCharacter.id, name: myCharacter.name, class: myCharacter.class_type,
          hp: myCharacter.max_hp, max_hp: myCharacter.max_hp, x: 100, y: 300, tx: 100, ty: 300 
        }
      });
      onJoinSession(session.id, false); // False = isGuest
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-md mx-auto text-center mt-10">
      <div className="flex items-center gap-3 mb-8 justify-center">
        <button onClick={onBack} className="absolute left-4 top-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <Users className="w-8 h-8 text-primary" />
        <h2 className="font-heading text-3xl font-bold text-foreground">Multiplayer</h2>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-xl mb-6">
        <h3 className="font-heading text-lg font-bold mb-4">Join a Friend</h3>
        <Input 
          value={joinCode} 
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())} 
          placeholder="Enter 4-Letter Code" 
          className="text-center text-2xl tracking-[0.5em] h-14 mb-4 uppercase font-bold" 
          maxLength={4}
        />
        <Button onClick={handleJoinGame} disabled={loading || joinCode.length !== 4} className="w-full h-12 text-lg">
          {loading ? <Loader2 className="animate-spin" /> : "Join Game"}
        </Button>
      </div>

      <div className="flex items-center gap-4 text-muted-foreground my-6">
        <div className="flex-1 h-px bg-border"></div>
        <span className="text-sm font-heading">OR</span>
        <div className="flex-1 h-px bg-border"></div>
      </div>

      <Button onClick={handleHostGame} disabled={loading} variant="outline" className="w-full h-14 border-primary/50 hover:bg-primary/10 text-primary text-lg">
        Create New Room
      </Button>

      {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
    </div>
  );
}