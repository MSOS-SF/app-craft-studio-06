import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UnoCard } from "@/components/game/UnoCard";
import { PlayerDisplay } from "@/components/game/PlayerDisplay";
import { useGameState } from "@/hooks/useGameState";
import { ArrowLeft } from "lucide-react";
import { makeOfflineAIDecision } from "@/lib/offlineAI";

const Game = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { playerName, isSinglePlayer } = location.state || {};
  const [showUnoButton, setShowUnoButton] = useState(false);
  const [unoAnnouncement, setUnoAnnouncement] = useState<string | null>(null);
  const [drawingAnimation, setDrawingAnimation] = useState(false);

  const { 
    gameState, 
    playCard, 
    drawCard, 
    canPlayCard,
    setGameState 
  } = useGameState(playerName, isSinglePlayer);

  if (!playerName) {
    navigate("/");
    return null;
  }

  // Check if player has 1 card - show UNO button
  useEffect(() => {
    const currentPlayer = gameState.players[0];
    if (currentPlayer?.hand.length === 1 && gameState.currentPlayerIndex === 0) {
      setShowUnoButton(true);
    } else {
      setShowUnoButton(false);
    }
  }, [gameState.players, gameState.currentPlayerIndex]);

  const handleUnoClick = () => {
    setShowUnoButton(false);
    setUnoAnnouncement(`${playerName} says UNO!`);
    setTimeout(() => setUnoAnnouncement(null), 3000);
  };

  const handleDrawCard = () => {
    setDrawingAnimation(true);
    drawCard();
    setTimeout(() => setDrawingAnimation(false), 500);
  };

  // AI player logic - runs when it's AI's turn (OFFLINE)
  useEffect(() => {
    if (!isSinglePlayer || gameState.currentPlayerIndex === 0) return;

    const makeAIMove = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // AI thinking time

      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      const decision = makeOfflineAIDecision(currentPlayer.hand, gameState.currentCard!);

      setGameState(prev => {
        if (decision.action === "draw") {
          // AI draws a card
          if (prev.drawPile.length === 0) return prev;
          
          const drawnCard = prev.drawPile[0];
          const newPlayers = [...prev.players];
          newPlayers[prev.currentPlayerIndex] = {
            ...newPlayers[prev.currentPlayerIndex],
            hand: [...newPlayers[prev.currentPlayerIndex].hand, drawnCard],
          };

          return {
            ...prev,
            players: newPlayers,
            drawPile: prev.drawPile.slice(1),
            currentPlayerIndex: (prev.currentPlayerIndex + prev.direction + prev.players.length) % prev.players.length,
          };
        } else {
          // AI plays a card
          const card = currentPlayer.hand[decision.cardIndex];
          const newPlayers = [...prev.players];
          newPlayers[prev.currentPlayerIndex] = {
            ...newPlayers[prev.currentPlayerIndex],
            hand: currentPlayer.hand.filter((_, i) => i !== decision.cardIndex),
          };

          let finalCard = card;
          if (card.color === "wild" && decision.newColor) {
            finalCard = { ...card, color: decision.newColor as any };
          }

          let nextPlayerIndex = (prev.currentPlayerIndex + prev.direction + prev.players.length) % prev.players.length;
          let newDirection = prev.direction;

          // Handle special cards
          if (card.value === "skip") {
            nextPlayerIndex = (nextPlayerIndex + prev.direction + prev.players.length) % prev.players.length;
          } else if (card.value === "reverse") {
            newDirection = prev.direction * -1 as 1 | -1;
          } else if (card.value === "+2") {
            const targetPlayer = nextPlayerIndex;
            const drawnCards = prev.drawPile.slice(0, 2);
            newPlayers[targetPlayer] = {
              ...newPlayers[targetPlayer],
              hand: [...newPlayers[targetPlayer].hand, ...drawnCards],
            };
            nextPlayerIndex = (nextPlayerIndex + newDirection + prev.players.length) % prev.players.length;
          } else if (card.value === "+4") {
            const targetPlayer = nextPlayerIndex;
            const drawnCards = prev.drawPile.slice(0, 4);
            newPlayers[targetPlayer] = {
              ...newPlayers[targetPlayer],
              hand: [...newPlayers[targetPlayer].hand, ...drawnCards],
            };
            nextPlayerIndex = (nextPlayerIndex + newDirection + prev.players.length) % prev.players.length;
          }

          return {
            ...prev,
            players: newPlayers,
            currentCard: finalCard,
            currentPlayerIndex: nextPlayerIndex,
            direction: newDirection,
            discardPile: [...prev.discardPile, finalCard],
          };
        }
      });
    };

    makeAIMove();
  }, [gameState.currentPlayerIndex, isSinglePlayer]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-game-bg-start to-game-bg-end overflow-hidden relative pb-64 md:pb-0">
      {/* Decorative triangles */}
      <div className="absolute inset-0 opacity-10 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute border-l-[20px] border-r-[20px] border-b-[30px] border-transparent border-b-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>

      {/* Top opponent */}
      <div className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2">
        <PlayerDisplay
          name={gameState.players[1]?.name || "Player 2"}
          cardCount={gameState.players[1]?.hand.length || 7}
          position="top"
        />
      </div>

      {/* Left opponent */}
      <div className="absolute left-4 md:left-8 top-1/4 md:top-1/2 md:-translate-y-1/2">
        <PlayerDisplay
          name={gameState.players[2]?.name || "Player 3"}
          cardCount={gameState.players[2]?.hand.length || 7}
          position="left"
        />
      </div>

      {/* Right opponent */}
      <div className="absolute right-4 md:right-8 top-1/4 md:top-1/2 md:-translate-y-1/2">
        <PlayerDisplay
          name={gameState.players[3]?.name || "Player 4"}
          cardCount={gameState.players[3]?.hand.length || 7}
          position="right"
        />
      </div>

      {/* Center play area */}
      <div className="absolute left-1/2 top-[35%] md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 flex items-center gap-4 md:gap-8 scale-75 md:scale-100">
        {/* Draw pile */}
        <div 
          className={`relative cursor-pointer transition-transform ${drawingAnimation ? 'scale-110 animate-pulse' : ''}`} 
          onClick={handleDrawCard}
        >
          <UnoCard color="wild" value="back" size="lg" />
          <div className="absolute -top-2 -right-2 bg-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg">
            {gameState.drawPile.length}
          </div>
        </div>

        {/* Current card with highlight */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-full border-4 border-accent animate-pulse" />
          {gameState.currentCard && (
            <UnoCard
              color={gameState.currentCard.color}
              value={gameState.currentCard.value}
              size="lg"
            />
          )}
        </div>

        {/* UNO logo */}
        <div className="hidden md:block absolute -right-32 top-1/2 -translate-y-1/2">
          <div className="bg-accent text-white font-bold text-4xl px-6 py-3 rounded-2xl shadow-2xl transform rotate-12">
            UNO
          </div>
        </div>
      </div>

      {/* Player's hand */}
      <div className="fixed bottom-0 left-0 right-0 bg-secondary/90 backdrop-blur-sm rounded-t-3xl p-4 md:p-6 shadow-2xl">
        <div className="flex gap-2 md:gap-3 items-end max-w-full overflow-x-auto pb-2 justify-center">
          {gameState.players[0]?.hand.map((card, index) => (
            <div
              key={`${card.color}-${card.value}-${index}`}
              className={`transition-transform hover:-translate-y-4 cursor-pointer flex-shrink-0 ${
                canPlayCard(card) ? "" : "opacity-50 cursor-not-allowed"
              }`}
              onClick={() => canPlayCard(card) && playCard(index)}
            >
              <UnoCard color={card.color} value={card.value} size="md" />
            </div>
          ))}
        </div>
      </div>

      {/* Current player indicator */}
      <div className="absolute bottom-48 md:bottom-40 left-1/2 -translate-x-1/2">
        {gameState.currentPlayerIndex === 0 ? (
          <div className="bg-accent text-white font-bold px-6 py-2 rounded-full shadow-lg animate-pulse">
            Your Turn
          </div>
        ) : (
          <div className="bg-white/80 text-foreground font-medium px-6 py-2 rounded-full shadow-lg">
            {gameState.players[gameState.currentPlayerIndex]?.name}'s Turn
          </div>
        )}
      </div>

      {/* UNO Button */}
      {showUnoButton && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 shadow-2xl animate-scale-in">
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-accent mb-2">UNO!</div>
              <p className="text-foreground">You have one card left!</p>
            </div>
            <Button 
              onClick={handleUnoClick}
              className="w-full bg-accent hover:bg-accent/90 text-white font-bold text-xl py-6"
            >
              Call UNO!
            </Button>
          </div>
        </div>
      )}

      {/* UNO Announcement */}
      {unoAnnouncement && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-scale-in">
          <div className="bg-accent text-white font-bold text-5xl px-12 py-6 rounded-3xl shadow-2xl border-4 border-white">
            {unoAnnouncement}
          </div>
        </div>
      )}

      {/* Back button */}
      <Button
        onClick={() => navigate("/")}
        variant="outline"
        size="sm"
        className="absolute top-4 left-4 bg-white/90 hover:bg-white gap-2 z-10"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
    </div>
  );
};

export default Game;
