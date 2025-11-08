import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Users } from "lucide-react";
import { useWebRTC } from "@/hooks/useWebRTC";

const Lobby = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { playerName, isHost } = location.state || {};
  
  const [roomCode, setRoomCode] = useState("");
  const [inputRoomCode, setInputRoomCode] = useState("");
  
  const { 
    localId, 
    peers, 
    createRoom, 
    joinRoom, 
    isConnected 
  } = useWebRTC(playerName);

  useEffect(() => {
    if (!playerName) {
      navigate("/");
      return;
    }

    if (isHost && !roomCode) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setRoomCode(code);
      createRoom(code);
    }
  }, [playerName, isHost, navigate]);

  const handleJoinRoom = () => {
    if (!inputRoomCode.trim()) {
      toast({
        title: "Room Code Required",
        description: "Please enter a room code",
        variant: "destructive",
      });
      return;
    }
    joinRoom(inputRoomCode.toUpperCase());
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast({
      title: "Copied!",
      description: "Room code copied to clipboard",
    });
  };

  const handleStartGame = () => {
    if (peers.length < 1) {
      toast({
        title: "Need More Players",
        description: "Wait for at least one more player to join",
        variant: "destructive",
      });
      return;
    }
    navigate("/game", { state: { playerName, isHost, roomCode, peers } });
  };

  const players = [
    { name: playerName, id: localId, isYou: true },
    ...peers.map(peer => ({ name: peer.name, id: peer.id, isYou: false }))
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-game-bg-start to-game-bg-end flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 bg-white/95 backdrop-blur-sm">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-primary mb-2">Game Lobby</h2>
          <p className="text-muted-foreground">
            {isHost ? "Waiting for players to join..." : "Connected to game"}
          </p>
        </div>

        {isHost ? (
          <div className="mb-8">
            <div className="bg-primary/10 p-6 rounded-lg border-2 border-primary">
              <p className="text-sm text-muted-foreground mb-2 text-center">
                Share this code with other players:
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white p-4 rounded-lg text-center">
                  <p className="text-4xl font-bold tracking-widest text-primary">
                    {roomCode}
                  </p>
                </div>
                <Button
                  onClick={handleCopyCode}
                  size="icon"
                  variant="secondary"
                  className="h-14 w-14"
                >
                  <Copy className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          !isConnected && (
            <div className="mb-8">
              <label className="text-sm font-medium mb-2 block">
                Enter Room Code
              </label>
              <div className="flex gap-3">
                <Input
                  type="text"
                  placeholder="XXXXXX"
                  value={inputRoomCode}
                  onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                  className="text-center text-2xl tracking-widest uppercase"
                  maxLength={6}
                />
                <Button onClick={handleJoinRoom} size="lg">
                  Join
                </Button>
              </div>
            </div>
          )
        )}

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold">
              Players ({players.length})
            </h3>
          </div>
          
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-4 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {player.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium">{player.name}</span>
                </div>
                {player.isYou && (
                  <span className="text-sm text-primary font-medium">You</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {isHost && (
          <Button
            onClick={handleStartGame}
            size="lg"
            className="w-full text-lg font-bold"
            disabled={peers.length < 1}
          >
            Start Game ({players.length} Players)
          </Button>
        )}

        {!isHost && isConnected && (
          <div className="text-center text-muted-foreground">
            Waiting for host to start the game...
          </div>
        )}
      </Card>
    </div>
  );
};

export default Lobby;
