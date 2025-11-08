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

  return (
    <div
      className={`${sizeClasses[size]} ${
        isBack ? "bg-uno-wild" : colorClasses[color]
      } rounded-lg border-4 border-white shadow-2xl flex items-center justify-center relative overflow-hidden`}
    >
      {isBack ? (
        <div className="absolute inset-0 bg-gradient-to-br from-uno-red via-uno-yellow to-uno-blue opacity-30" />
      ) : (
        <>
          {/* Card background ellipse */}
          <div className="absolute inset-2 bg-white rounded-full" />
          
          {/* Card value */}
          <div className={`relative z-10 font-bold ${
            size === "lg" ? "text-4xl" : size === "md" ? "text-2xl" : "text-xl"
          } ${color === "yellow" ? "text-uno-wild" : "text-uno-wild"}`}>
            {value}
          </div>

          {/* Corner values */}
          <div className={`absolute top-1 left-1 font-bold text-white ${
            size === "lg" ? "text-sm" : "text-xs"
          }`}>
            {value}
          </div>
          <div className={`absolute bottom-1 right-1 font-bold text-white rotate-180 ${
            size === "lg" ? "text-sm" : "text-xs"
          }`}>
            {value}
          </div>
        </>
      )}
    </div>
  );
};
