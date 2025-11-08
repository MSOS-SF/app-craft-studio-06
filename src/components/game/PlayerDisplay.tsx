import { UnoCard } from "./UnoCard";

interface PlayerDisplayProps {
  name: string;
  cardCount: number;
  position: "top" | "left" | "right";
}

export const PlayerDisplay = ({ name, cardCount, position }: PlayerDisplayProps) => {
  const isVertical = position === "left" || position === "right";

  return (
    <div className={`flex ${isVertical ? "flex-col" : "flex-row"} items-center gap-4`}>
      {/* Player avatar and info */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full bg-white border-4 border-accent shadow-lg flex items-center justify-center">
          <span className="text-2xl font-bold text-primary">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="text-white font-bold text-sm drop-shadow-lg text-center">
          {name}
        </div>
      </div>

      {/* Card stack */}
      <div className={`relative ${isVertical ? "h-32" : "w-32"}`}>
        {[...Array(Math.min(cardCount, 5))].map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              [isVertical ? "top" : "left"]: `${i * (isVertical ? 6 : 8)}px`,
              [isVertical ? "left" : "top"]: 0,
              zIndex: i,
            }}
          >
            <UnoCard color="wild" value="back" size="sm" />
          </div>
        ))}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs shadow-lg z-10">
          {cardCount}
        </div>
      </div>
    </div>
  );
};
