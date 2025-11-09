import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface EmojiSelectorProps {
  selectedEmoji: string;
  onSelectEmoji: (emoji: string) => void;
}

const emojis = ["😀", "😎", "🤖", "👾", "🎮", "🔥", "⚡", "🌟", "🎯", "🎪", "🎨", "🎭"];

export const EmojiSelector = ({ selectedEmoji, onSelectEmoji }: EmojiSelectorProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="text-2xl p-2 h-auto">
          {selectedEmoji}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid grid-cols-4 gap-2">
          {emojis.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              className="text-3xl h-14 hover:scale-110 transition-transform"
              onClick={() => {
                onSelectEmoji(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
