import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Copy, Users, QrCode, Camera, ArrowLeft } from "lucide-react";
import { useWebRTCContext } from "@/contexts/WebRTCContext";
import { QRCodeCanvas } from "qrcode.react";
import { Scanner } from "@yudiel/react-qr-scanner";

const Lobby = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { playerName, isHost } = location.state || {};
  
  const [hostData, setHostData] = useState("");
  const [playerData, setPlayerData] = useState("");
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showHostQRScanner, setShowHostQRScanner] = useState(false);
  const [qrSize, setQrSize] = useState(200);
  const [joinerQrSize, setJoinerQrSize] = useState(200);
  const [gameStarted, setGameStarted] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [maxQrSize, setMaxQrSize] = useState(300);
  
  const handleGameStateReceived = useCallback((message: any) => {
    console.log("Message received in lobby:", message);
    // Guard against invalid messages and unwrap nested game_state envelopes
    if (!message || typeof message !== "object") return;
    let payload: any = message;
    while (payload && payload.type === "game_state" && payload.data) {
      payload = payload.data;
    }
    if (payload?.type === "start_game") {
      setGameStarted(true);
    }
  }, []);
  const handleJoinGame = () => {
    navigate("/game", { 
      state: { 
        playerName, 
        isHost: false, 
        isMultiplayer: true 
      } 
    });
  };

  const rtc = useWebRTCContext();
  const {
    localId,
    peers,
    createRoom,
    joinRoom,
    applyAnswer,
    isConnected,
    connectedPlayerCount,
    offerData,
    broadcastGameState,
    sendMessage,
  } = rtc;

  useEffect(() => {
    const updateMaxSize = () => {
      const screenWidth = window.innerWidth;
      const maxSize = Math.min(300, screenWidth - 160);
      setMaxQrSize(maxSize);
      setQrSize(Math.min(200, maxSize));
      setJoinerQrSize(Math.min(200, maxSize));
    };
    
    updateMaxSize();
    window.addEventListener('resize', updateMaxSize);
    return () => window.removeEventListener('resize', updateMaxSize);
  }, []);

  useEffect(() => {
    rtc.setPlayerName(playerName || "");
    rtc.setMessageHandler(handleGameStateReceived);
  }, [playerName, handleGameStateReceived]);

  useEffect(() => {
    if (!playerName) {
      navigate("/");
      return;
    }

    if (isHost) {
      console.log("Creating room as host...");
      createRoom();
    }
  }, [playerName, isHost, navigate]);
  
  useEffect(() => {
    console.log("Offer data updated:", offerData ? "Generated" : "Empty");
  }, [offerData]);

  const handleJoin = () => {
    if (!hostData.trim()) {
      toast({
        title: "Missing Information",
        description: "Scan host's QR code or paste connection data",
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

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
      return true;
    } catch (error) {
      console.error('Camera permission error:', error);
      setCameraPermission('denied');
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to scan QR codes",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleShowScanner = async (isHost: boolean) => {
    if (cameraPermission === 'denied') {
      toast({
        title: "Camera Access Required",
        description: "Please enable camera permissions in your browser settings",
        variant: "destructive",
      });
      return;
    }

    const granted = await requestCameraPermission();
    if (granted) {
      if (isHost) {
        setShowHostQRScanner(true);
      } else {
        setShowQRScanner(true);
      }
    }
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
    if (connectedPlayerCount === 0) {
      toast({
        title: "No Players",
        description: "Wait for at least 1 player to connect",
        variant: "destructive",
      });
      return;
    }
    
    // Broadcast start game message to all players
    sendMessage({ type: "start_game" });
    
    // Navigate host to game
    navigate("/game", { state: { playerName, isHost, isMultiplayer: true } });
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

      <Card className="w-full max-w-2xl p-4 sm:p-8 bg-white/95 backdrop-blur-sm overflow-hidden">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-4xl font-bold text-primary mb-2 break-words">
            Local Hotspot Game
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isHost ? "Share connection QR code with players" : "Scan host's QR code to join"}
          </p>
        </div>

        {isHost ? (
          <div className="mb-6 space-y-6">
            <div className="p-6 bg-primary/5 rounded-lg border-2 border-primary/20 space-y-4">
              {offerData ? (
                <div>
                  <Label className="text-lg font-semibold mb-2 block">Connection QR Code</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Up to 3 players can scan this same QR code
                  </p>
                  <div className="flex flex-col items-center gap-3 p-3 sm:p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border-2 border-primary/30">
                    <div className="bg-white p-2 sm:p-4 rounded-xl shadow-lg">
                      <QRCodeCanvas 
                        value={offerData} 
                        size={qrSize}
                        level="L"
                        includeMargin={false}
                      />
                    </div>
                    <Button
                      onClick={() => setQrSize(qrSize === 200 ? maxQrSize : 200)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <QrCode className="h-4 w-4" />
                      {qrSize === 200 ? "Enlarge QR" : "Shrink QR"}
                    </Button>
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
              ) : (
                <div className="flex flex-col items-center gap-2 py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Generating connection code...</p>
                </div>
              )}
            </div>
            
            {offerData && connectedPlayerCount < 3 && (
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <Label className="font-semibold flex items-center justify-between">
                  Add More Players ({connectedPlayerCount}/3)
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => showHostQRScanner ? setShowHostQRScanner(false) : handleShowScanner(true)}
                    className="gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    {showHostQRScanner ? "Hide Camera" : "Scan Player's QR"}
                  </Button>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Scan each player's QR code or paste their connection data:
                </p>

                {showHostQRScanner && (
                  <div className="mb-4 rounded-lg overflow-hidden border-2 border-primary">
                    <Scanner
                      constraints={{ facingMode: 'environment' }}
                      scanDelay={200}
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
            
            {connectedPlayerCount > 0 && (
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <p className="text-center text-green-700 font-semibold text-lg">
                  ✓ {connectedPlayerCount} Player{connectedPlayerCount > 1 ? 's' : ''} Connected!
                </p>
                {connectedPlayerCount < 3 && (
                  <p className="text-center text-green-600 text-sm mt-1">
                    You can add {3 - connectedPlayerCount} more player{3 - connectedPlayerCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6 space-y-4">
            <div className="p-6 bg-muted rounded-lg space-y-4">
              <div>
                <Label className="font-semibold mb-2 flex items-center justify-between">
                  Host's Connection Data
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => showQRScanner ? setShowQRScanner(false) : handleShowScanner(false)}
                    className="gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    {showQRScanner ? "Hide Camera" : "Scan QR Code"}
                  </Button>
                </Label>

                {showQRScanner && (
                  <div className="mb-4 rounded-lg overflow-hidden border-2 border-primary">
                    <Scanner
                      constraints={{ facingMode: 'environment' }}
                      scanDelay={200}
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
                disabled={!hostData.trim()}
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
                <div className="flex flex-col items-center gap-3 p-3 sm:p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border-2 border-primary/30">
                  <div className="bg-white p-2 sm:p-4 rounded-xl shadow-lg">
                    <QRCodeCanvas 
                      value={offerData} 
                      size={joinerQrSize}
                      level="L"
                      includeMargin={false}
                    />
                  </div>
                  <Button
                    onClick={() => setJoinerQrSize(joinerQrSize === 200 ? maxQrSize : 200)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <QrCode className="h-4 w-4" />
                    {joinerQrSize === 200 ? "Enlarge QR" : "Shrink QR"}
                  </Button>
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

            {gameStarted ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <p className="text-center text-green-700 font-semibold text-lg">
                    🎮 Game Started!
                  </p>
                  <p className="text-center text-green-600 text-sm mt-1">
                    Click below to join the game
                  </p>
                </div>
                <Button 
                  onClick={handleJoinGame}
                  size="lg"
                  className="w-full text-lg font-bold"
                >
                  Join Game
                </Button>
              </div>
            ) : isConnected ? (
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <p className="text-center text-green-700 font-semibold">
                  ✓ Connected! Waiting for game to start...
                </p>
              </div>
            ) : null}
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-semibold">
              Players ({players.length}{isHost ? '/4' : ''})
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
            disabled={connectedPlayerCount === 0}
          >
            Start Game ({connectedPlayerCount + 1} Player{connectedPlayerCount + 1 > 1 ? 's' : ''})
          </Button>
        )}
      </Card>
    </div>
  );
};

export default Lobby;
