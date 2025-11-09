import unoCardBack from "@/assets/uno-card-back.png";

interface UnoCardProps {
  color: "red" | "yellow" | "green" | "blue" | "wild";
  value: string | number;
  size?: "sm" | "md" | "lg";
}

export const UnoCard = ({ color, value, size = "md" }: UnoCardProps) => {
  const sizeClasses = {
    sm: "w-12 h-18",
    md: "w-16 h-24",
    lg: "w-20 h-32",
  };

  const colorClasses = {
    red: "bg-uno-red",
    yellow: "bg-uno-yellow",
    green: "bg-uno-green",
    blue: "bg-uno-blue",
    wild: "bg-uno-wild",
  };

  const isBack = value === "back";
  
  // Get display value with emojis for special cards
  const getDisplayValue = () => {
    if (value === "reverse") return "🔄";
    if (value === "skip") return "🚫";
    if (value === "+2") return "+2";
    if (value === "+4") return "+4";
    if (value === "wild") return "W";
    return value;
  };
  
  const displayValue = getDisplayValue();

  return (
    <div
      className={`${sizeClasses[size]} ${
        isBack ? "bg-black" : colorClasses[color]
      } rounded-xl border-[3px] border-white shadow-2xl flex items-center justify-center relative overflow-hidden transition-transform`}
    >
      {isBack ? (
        <img 
          src={unoCardBack} 
          alt="UNO Card Back" 
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <>
          {/* Diagonal stripe design */}
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className="absolute w-[120%] h-[80%] border-[6px] border-white rounded-full transform -rotate-[25deg]"
              style={{
                left: '-10%',
                top: '10%',
              }}
            />
          </div>
          
          {/* Center ellipse background */}
          <div className="absolute inset-[15%] bg-white rounded-full transform rotate-[-25deg]" />
          
          {/* Card value - white with black outline */}
          <div 
            className={`relative z-10 font-black ${
              size === "lg" ? "text-5xl" : size === "md" ? "text-3xl" : "text-2xl"
            }`}
            style={{
              color: value === "+4" || value === "wild" ? '#000' : colorClasses[color].replace('bg-', 'hsl(var(--'),
              WebkitTextStroke: value === "+4" || value === "wild" ? '0' : '2px #fff',
              textShadow: value === "+4" || value === "wild" ? 'none' : '-2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff, 2px 2px 0 #fff'
            }}
          >
            {displayValue}
          </div>

          {/* Corner values */}
          <div className={`absolute top-[2px] left-[3px] font-bold text-white ${
            size === "lg" ? "text-base" : "text-xs"
          }`}>
            {displayValue}
          </div>
          <div className={`absolute bottom-[2px] right-[3px] font-bold text-white rotate-180 ${
            size === "lg" ? "text-base" : "text-xs"
          }`}>
            {displayValue}
          </div>
        </>
      )}
    </div>
  );
};
