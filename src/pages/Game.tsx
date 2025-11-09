import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UnoCard } from "@/components/game/UnoCard";
import { PlayerDisplay } from "@/components/game/PlayerDisplay";
import { useGameState } from "@/hooks/useGameState";
import { ArrowLeft } from "lucide-react";
import { callAIPlayer } from "@/lib/supabaseClient";

const Game = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { playerName, isSinglePlayer } = location.state || {};

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

  // AI player logic - runs when it's AI's turn
  useEffect(() => {
    if (!isSinglePlayer || gameState.currentPlayerIndex === 0) return;

    const makeAIMove = async () => {
      await new Promise(resolve => setTimeout(resolve, 1500)); // AI thinking time

      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      const decision = await callAIPlayer(currentPlayer.hand, gameState.currentCard);

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
    <div className="min-h-screen bg-gradient-to-b from-game-bg-start to-game-bg-end overflow-hidden relative">
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
      <div className="absolute top-8 left-1/2 -translate-x-1/2">
        <PlayerDisplay
          name={gameState.players[1]?.name || "Player 2"}
          cardCount={gameState.players[1]?.hand.length || 7}
          position="top"
        />
      </div>

      {/* Left opponent */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2">
        <PlayerDisplay
          name={gameState.players[2]?.name || "Player 3"}
          cardCount={gameState.players[2]?.hand.length || 7}
          position="left"
        />
      </div>

      {/* Right opponent */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2">
        <PlayerDisplay
          name={gameState.players[3]?.name || "Player 4"}
          cardCount={gameState.players[3]?.hand.length || 7}
          position="right"
        />
      </div>

      {/* Center play area */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-8">
        {/* Draw pile */}
        <div className="relative cursor-pointer" onClick={drawCard}>
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
        <div className="absolute -right-32 top-1/2 -translate-y-1/2">
          <div className="bg-accent text-white font-bold text-4xl px-6 py-3 rounded-2xl shadow-2xl transform rotate-12">
            UNO
          </div>
        </div>
      </div>

      {/* Player's hand */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="bg-secondary/80 backdrop-blur-sm rounded-3xl p-6 shadow-2xl">
          <div className="flex gap-2 items-end max-w-[90vw] overflow-x-auto pb-2">
            {gameState.players[0]?.hand.map((card, index) => (
              <div
                key={`${card.color}-${card.value}-${index}`}
                className={`transition-transform hover:-translate-y-4 cursor-pointer ${
                  canPlayCard(card) ? "" : "opacity-50 cursor-not-allowed"
                }`}
                onClick={() => canPlayCard(card) && playCard(index)}
              >
                <UnoCard color={card.color} value={card.value} size="md" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current player indicator */}
      <div className="absolute bottom-40 left-1/2 -translate-x-1/2">
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
