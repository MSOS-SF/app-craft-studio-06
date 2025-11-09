import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Copy, Users, QrCode, Camera, ArrowLeft } from "lucide-react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { QRCodeCanvas } from "qrcode.react";
import { Scanner } from "@yudiel/react-qr-scanner";

const Lobby = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { playerName, isHost } = location.state || {};
  
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [hostData, setHostData] = useState("");
  const [playerData, setPlayerData] = useState("");
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showHostQRScanner, setShowHostQRScanner] = useState(false);
  
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
      const code = Math.random().toString(36).substring(2, 6).toUpperCase();
      setRoomCode(code);
      createRoom(code);
    }
  }, [playerName, isHost, navigate]);

  const handleJoin = () => {
    if (!joinCode.trim() || !hostData.trim()) {
      toast({
        title: "Missing Information",
        description: "Enter room code and host's connection data",
        variant: "destructive",
      });
      return;
    }
    joinRoom(hostData);
  };

  const handleApplyPlayerConnection = () => {
    if (!playerData.trim()) {
      toast({
        title: "Missing Player Data",
        description: "Paste player's connection data",
        variant: "destructive",
      });
      return;
    }
    applyAnswer(playerData);
    setPlayerData("");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Copied to clipboard",
    });
  };

  const handleQRScan = (result: string) => {
    setHostData(result);
    setShowQRScanner(false);
    toast({
      title: "QR Code Scanned!",
      description: "Connection data captured",
    });
  };

  const handleHostQRScan = (result: string) => {
    setPlayerData(result);
    setShowHostQRScanner(false);
    toast({
      title: "QR Code Scanned!",
      description: "Player connection data captured",
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
    { name: playerName || "You", id: localId, isYou: true },
    ...peers.map(peer => ({ name: peer.name || "Player", id: peer.id, isYou: false }))
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-game-bg-start to-game-bg-end flex items-center justify-center p-4">
      <Button
        onClick={() => navigate("/")}
        variant="outline"
        size="sm"
        className="absolute top-4 left-4 bg-white/90 hover:bg-white gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <Card className="w-full max-w-2xl p-8 bg-white/95 backdrop-blur-sm">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-primary mb-2">
            Local Hotspot Game
          </h2>
          <p className="text-sm text-muted-foreground">
            {isHost ? "Share room code & connection data" : "Enter room details to join"}
          </p>
        </div>

        {isHost ? (
          <div className="mb-6 space-y-6">
            <div className="p-6 bg-primary/5 rounded-lg border-2 border-primary/20 space-y-4">
              <div>
                <Label className="text-lg font-semibold mb-2 block">Room Code</Label>
                <div className="flex gap-2">
                  <Input 
                    value={roomCode} 
                    readOnly 
                    className="text-2xl font-bold text-center tracking-widest"
                  />
                  <Button 
                    size="icon"
                    onClick={() => copyToClipboard(roomCode)}
                    variant="secondary"
                  >
                    <Copy className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {offerData && (
                <div>
                  <Label className="text-lg font-semibold mb-2 block">Connection QR Code</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Player can scan this with their camera
                  </p>
                  <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border-2 border-primary/30">
                    <div className="bg-white p-4 rounded-xl shadow-lg">
                      <QRCodeCanvas 
                        value={offerData} 
                        size={220}
                        level="M"
                        includeMargin={true}
                      />
                    </div>
                    <div className="w-full">
                      <Label className="text-sm mb-2 block">Or copy text:</Label>
                      <div className="flex gap-2">
                        <Input
                          value={offerData} 
                          readOnly 
                          className="text-xs font-mono"
                        />
                        <Button 
                          size="icon"
                          onClick={() => copyToClipboard(offerData)}
                          variant="secondary"
                        >
                          <Copy className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {offerData && !isConnected && (
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <Label className="font-semibold flex items-center justify-between">
                  Waiting for Player...
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHostQRScanner(!showHostQRScanner)}
                    className="gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    {showHostQRScanner ? "Hide Camera" : "Scan Player's QR"}
                  </Button>
                </Label>
                <p className="text-xs text-muted-foreground">
                  When player connects, scan their QR code or paste their connection data:
                </p>

                {showHostQRScanner && (
                  <div className="mb-4 rounded-lg overflow-hidden border-2 border-primary">
                    <Scanner
                      onScan={(result) => {
                        if (result && result[0]) {
                          handleHostQRScan(result[0].rawValue);
                        }
                      }}
                      onError={(error) => console.error(error)}
                      styles={{ container: { width: "100%" } }}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <textarea
                    value={playerData}
                    onChange={(e) => setPlayerData(e.target.value)}
                    placeholder="Player's connection data or scan their QR code..."
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                  <Button 
                    onClick={handleApplyPlayerConnection} 
                    disabled={!playerData.trim()}
                    className="w-full"
                  >
                    Complete Connection
                  </Button>
                </div>
              </div>
            )}
            
            {isConnected && (
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <p className="text-center text-green-700 font-semibold text-lg">
                  ✓ Player Connected!
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6 space-y-4">
            <div className="p-6 bg-muted rounded-lg space-y-4">
              <div>
                <Label className="font-semibold mb-2 block">Room Code</Label>
                <Input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter room code (e.g., AB12)"
                  className="text-xl font-bold text-center tracking-widest"
                  maxLength={4}
                />
              </div>

              <div>
                <Label className="font-semibold mb-2 flex items-center justify-between">
                  Host's Connection Data
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQRScanner(!showQRScanner)}
                    className="gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    {showQRScanner ? "Hide Camera" : "Scan QR Code"}
                  </Button>
                </Label>

                {showQRScanner && (
                  <div className="mb-4 rounded-lg overflow-hidden border-2 border-primary">
                    <Scanner
                      onScan={(result) => {
                        if (result && result[0]) {
                          handleQRScan(result[0].rawValue);
                        }
                      }}
                      onError={(error) => console.error(error)}
                      styles={{ container: { width: "100%" } }}
                    />
                  </div>
                )}

                <textarea
                  value={hostData}
                  onChange={(e) => setHostData(e.target.value)}
                  placeholder="Paste host's connection data or scan QR code..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleJoin}
                disabled={!joinCode.trim() || !hostData.trim()}
              >
                Join Room
              </Button>
            </div>
            
            {offerData && (
              <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-lg space-y-2">
                <Label className="font-semibold block">Your Connection Data</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Host can scan this QR code or copy the text:
                </p>
                <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border-2 border-primary/30">
                  <div className="bg-white p-4 rounded-xl shadow-lg">
                    <QRCodeCanvas 
                      value={offerData} 
                      size={220}
                      level="M"
                      includeMargin={true}
                    />
                  </div>
                  <div className="w-full">
                    <Label className="text-sm mb-2 block">Or copy text:</Label>
                    <div className="flex gap-2">
                      <Input
                        value={offerData} 
                        readOnly 
                        className="text-xs font-mono"
                      />
                      <Button 
                        size="icon"
                        onClick={() => copyToClipboard(offerData)}
                        variant="secondary"
                      >
                        <Copy className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isConnected && (
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <p className="text-center text-green-700 font-semibold">
                  ✓ Connected! Waiting for game to start...
                </p>
              </div>
            )}
          </div>
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
                      {player.name?.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                  <span className="font-medium">{player.name || "Unknown"}</span>
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
