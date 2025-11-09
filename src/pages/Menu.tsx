import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Wifi, Bluetooth, ArrowLeft } from "lucide-react";

const Menu = () => {
  const [playerName, setPlayerName] = useState("");
  const [showHostOptions, setShowHostOptions] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSinglePlayer = () => {
    if (!playerName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name before starting",
        variant: "destructive",
      });
      return;
    }
    navigate("/game", { state: { playerName, isSinglePlayer: true } });
  };

  const handleHost = () => {
    if (!playerName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name before hosting",
        variant: "destructive",
      });
      return;
    }
    setShowHostOptions(true);
  };

  const handleHostWithWiFi = () => {
    navigate("/lobby", { state: { playerName, isHost: true, connectionType: "wifi" } });
  };

  const handleHostWithBluetooth = () => {
    toast({
      title: "Bluetooth Coming Soon",
      description: "Build the APK first, then Bluetooth will be available",
    });
    // navigate("/lobby", { state: { playerName, isHost: true, connectionType: "bluetooth" } });
  };

  const handleJoin = () => {
    if (!playerName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name before joining",
        variant: "destructive",
      });
      return;
    }
    navigate("/lobby", { state: { playerName, isHost: false } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-game-bg-start to-game-bg-end flex items-center justify-center p-4">
      {showHostOptions && (
        <Button
          onClick={() => setShowHostOptions(false)}
          variant="outline"
          size="sm"
          className="absolute top-4 left-4 bg-white/90 hover:bg-white gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      )}

      <div className="text-center space-y-8 w-full max-w-md">
        <Input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="w-full bg-white/90 backdrop-blur-sm border-2 border-white shadow-lg text-base"
          maxLength={20}
        />
        <div className="mt-4">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 drop-shadow-2xl">
            UNO
          </h1>
          <p className="text-xl md:text-2xl text-white/90 drop-shadow-lg">
            Local Multiplayer Game
          </p>
        </div>

        <div className="flex flex-col gap-6 items-center">
          {!showHostOptions ? (
            <>
              <Button
                onClick={handleSinglePlayer}
                size="lg"
                className="w-64 h-16 text-2xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl"
              >
                Single Player (AI)
              </Button>

              <Button
                onClick={handleHost}
                size="lg"
                className="w-64 h-16 text-2xl font-bold bg-accent hover:bg-accent/90 text-accent-foreground shadow-2xl"
              >
                Host Multiplayer
              </Button>

              <Button
                onClick={handleJoin}
                size="lg"
                className="w-64 h-16 text-2xl font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-2xl"
              >
                Join Multiplayer
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">
                Choose Connection Type
              </h2>
              
              <Button
                onClick={handleHostWithWiFi}
                size="lg"
                className="w-72 h-20 text-xl font-bold bg-accent hover:bg-accent/90 text-accent-foreground shadow-2xl flex items-center gap-4"
              >
                <Wifi className="h-8 w-8" />
                <div className="text-left">
                  <div>WiFi Peer-to-Peer</div>
                  <div className="text-sm font-normal opacity-90">WebRTC (Copy/Paste)</div>
                </div>
              </Button>

              <Button
                onClick={handleHostWithBluetooth}
                size="lg"
                className="w-72 h-20 text-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl flex items-center gap-4"
              >
                <Bluetooth className="h-8 w-8" />
                <div className="text-left">
                  <div>Bluetooth</div>
                  <div className="text-sm font-normal opacity-90">Native App Only</div>
                </div>
              </Button>

            </>
          )}
        </div>

        <div className="text-white/70 text-sm mt-8 max-w-md mx-auto">
          <p>To play together without internet:</p>
          <p className="mt-2">Host creates a hotspot (no data needed)</p>
          <p>Other players connect to the hotspot and join</p>
        </div>
      </div>
    </div>
  );
};

export default Menu;
