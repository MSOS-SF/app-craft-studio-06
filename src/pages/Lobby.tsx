import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Users } from "lucide-react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { QRCodeSVG } from "qrcode.react";

const Lobby = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { playerName, isHost } = location.state || {};
  
  const [roomCode, setRoomCode] = useState("");
  const [connectionString, setConnectionString] = useState("");
  const [answerString, setAnswerString] = useState("");
  
  const { 
    localId, 
    peers, 
    createRoom, 
    joinRoom,
    applyAnswer,
    isConnected,
    offerData
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

  const handleJoinWithString = () => {
    if (!connectionString.trim()) {
      toast({
        title: "Connection String Required",
        description: "Please paste the connection string from host",
        variant: "destructive",
      });
      return;
    }
    joinRoom(connectionString);
  };

  const handleApplyAnswer = () => {
    if (!answerString.trim()) {
      toast({
        title: "Answer String Required",
        description: "Please paste the answer string from joining player",
        variant: "destructive",
      });
      return;
    }
    applyAnswer(answerString);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Copied to clipboard",
    });
  };

  const handleStartGame = () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Wait for players to connect first",
        variant: "destructive",
      });
      return;
    }
    navigate("/game", { state: { playerName, isHost, roomCode } });
  };

  const players = [
    { name: playerName, id: localId, isYou: true },
    ...peers.map(peer => ({ name: peer.name, id: peer.id, isYou: false }))
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-game-bg-start to-game-bg-end flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 bg-white/95 backdrop-blur-sm">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-primary mb-2">
            Offline Game Lobby
          </h2>
          <p className="text-sm text-muted-foreground">
            {isHost ? "Show QR code to player" : "Scan host's QR code to join"}
          </p>
        </div>

        {isHost ? (
          <>
            <div className="mb-6">
              {offerData ? (
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-lg border-2 border-primary flex justify-center">
                    <QRCodeSVG value={offerData} size={200} />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground text-center">
                      Or share connection string:
                    </p>
                    <div className="flex gap-2">
                      <Input 
                        value={offerData} 
                        readOnly 
                        className="text-xs font-mono"
                      />
                      <Button 
                        size="sm" 
                        onClick={() => copyToClipboard(offerData)}
                        variant="secondary"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground">
                  Generating QR code...
                </p>
              )}
            </div>
            
            {offerData && !isConnected && (
              <div className="mb-6 p-4 bg-muted rounded-lg space-y-3">
                <p className="text-sm font-medium">Step 2: Apply answer</p>
                <p className="text-xs text-muted-foreground">
                  After player scans QR code, they'll give you an answer string. Paste it here:
                </p>
                <div className="flex gap-2">
                  <Input
                    value={answerString}
                    onChange={(e) => setAnswerString(e.target.value)}
                    placeholder="Paste answer string"
                    className="text-xs font-mono"
                  />
                  <Button onClick={handleApplyAnswer} disabled={!answerString}>
                    Connect
                  </Button>
                </div>
              </div>
            )}
            
            {isConnected && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-center text-green-700 font-medium">
                  ✓ Player Connected!
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-6 space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-3">Step 1: Connect to host</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Scan the host's QR code or paste connection string below:
                </p>
                <Input
                  value={connectionString}
                  onChange={(e) => setConnectionString(e.target.value)}
                  placeholder="Paste connection string"
                  className="text-xs font-mono mb-2"
                />
                <Button 
                  className="w-full" 
                  onClick={handleJoinWithString}
                  disabled={!connectionString}
                >
                  Connect to Host
                </Button>
              </div>
              
              {isConnected && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-center text-green-700 font-medium mb-2">
                    ✓ Connected to host!
                  </p>
                  <p className="text-xs text-center text-muted-foreground">
                    Waiting for host to start game...
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        <div className="mb-6">
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
            disabled={!isConnected}
          >
            Start Game
          </Button>
        )}
      </Card>
    </div>
  );
};

export default Lobby;
