import { Volume2, VolumeX, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useAudio } from "@/hooks/useAudio";

export const AudioSettings = () => {
  const { settings, toggleSfx, toggleMusic, setSfxVolume, setMusicVolume } = useAudio();

  return (
    <Card className="p-6 space-y-6 bg-white/95 backdrop-blur-sm">
      <div>
        <h3 className="text-2xl font-bold text-primary mb-4">Audio Settings</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.sfxEnabled ? (
              <Volume2 className="h-5 w-5 text-primary" />
            ) : (
              <VolumeX className="h-5 w-5 text-muted-foreground" />
            )}
            <Label className="text-base">Sound Effects</Label>
          </div>
          <Button
            variant={settings.sfxEnabled ? "default" : "outline"}
            size="sm"
            onClick={toggleSfx}
          >
            {settings.sfxEnabled ? "ON" : "OFF"}
          </Button>
        </div>

        {settings.sfxEnabled && (
          <div className="pl-8">
            <Label className="text-sm text-muted-foreground mb-2 block">Volume</Label>
            <Slider
              value={[settings.sfxVolume * 100]}
              onValueChange={(value) => setSfxVolume(value[0] / 100)}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Music className={`h-5 w-5 ${settings.musicEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
            <Label className="text-base">Background Music</Label>
          </div>
          <Button
            variant={settings.musicEnabled ? "default" : "outline"}
            size="sm"
            onClick={toggleMusic}
          >
            {settings.musicEnabled ? "ON" : "OFF"}
          </Button>
        </div>

        {settings.musicEnabled && (
          <div className="pl-8">
            <Label className="text-sm text-muted-foreground mb-2 block">Volume</Label>
            <Slider
              value={[settings.musicVolume * 100]}
              onValueChange={(value) => setMusicVolume(value[0] / 100)}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        )}
      </div>
    </Card>
  );
};
