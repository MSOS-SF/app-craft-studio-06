import { Button } from "@/components/ui/button";

interface ColorPickerProps {
  onSelectColor: (color: "red" | "yellow" | "green" | "blue") => void;
}

export const ColorPicker = ({ onSelectColor }: ColorPickerProps) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-background rounded-3xl p-8 shadow-2xl animate-scale-in max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6">Choose a Color</h2>
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => onSelectColor("red")}
            className="h-24 text-2xl font-bold bg-uno-red hover:bg-uno-red/90 text-white"
          >
            Red
          </Button>
          <Button
            onClick={() => onSelectColor("yellow")}
            className="h-24 text-2xl font-bold bg-uno-yellow hover:bg-uno-yellow/90 text-black"
          >
            Yellow
          </Button>
          <Button
            onClick={() => onSelectColor("green")}
            className="h-24 text-2xl font-bold bg-uno-green hover:bg-uno-green/90 text-white"
          >
            Green
          </Button>
          <Button
            onClick={() => onSelectColor("blue")}
            className="h-24 text-2xl font-bold bg-uno-blue hover:bg-uno-blue/90 text-white"
          >
            Blue
          </Button>
        </div>
      </div>
    </div>
  );
};
