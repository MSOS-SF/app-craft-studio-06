import { UnoCard } from "./UnoCard";

interface PlayerDisplayProps {
  name: string;
  cardCount: number;
  position: "top" | "left" | "right";
  emoji?: string;
}

export const PlayerDisplay = ({ name, cardCount, position, emoji = "😀" }: PlayerDisplayProps) => {
  const isVertical = position === "left" || position === "right";

  return (
    <div className={`flex ${isVertical ? "flex-col" : "flex-row"} items-center gap-4 bg-white/90 rounded-2xl p-4 shadow-xl`}>
      {/* Player avatar and info */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full bg-accent border-4 border-white shadow-lg flex items-center justify-center">
          <span className="text-3xl">
            {emoji}
          </span>
        </div>
        <div className="text-foreground font-bold text-sm text-center">
          {name}
        </div>
      </div>

      {/* Card count - BIG and CLEAR */}
      <div className="bg-accent text-white font-bold text-4xl px-6 py-3 rounded-xl shadow-lg border-4 border-white">
        {cardCount}
      </div>
    </div>
  );
};
