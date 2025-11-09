import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface WinnerModalProps {
  winnerName: string;
}

export const WinnerModal = ({ winnerName }: WinnerModalProps) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-gradient-to-br from-accent to-primary rounded-3xl p-12 shadow-2xl animate-scale-in text-center max-w-md">
        <div className="text-8xl mb-4">🎉</div>
        <h2 className="text-5xl font-bold text-white mb-4">Winner!</h2>
        <p className="text-3xl text-white mb-8">{winnerName} wins!</p>
        <div className="flex gap-4">
          <Button
            onClick={() => navigate("/")}
            className="flex-1 bg-white text-accent hover:bg-white/90 font-bold text-xl py-6"
          >
            Back to Menu
          </Button>
          <Button
            onClick={() => window.location.reload()}
            className="flex-1 bg-secondary text-white hover:bg-secondary/90 font-bold text-xl py-6"
          >
            Play Again
          </Button>
        </div>
      </div>
    </div>
  );
};
