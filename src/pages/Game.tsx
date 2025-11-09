import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UnoCard } from "@/components/game/UnoCard";
import { PlayerDisplay } from "@/components/game/PlayerDisplay";
import { ColorPicker } from "@/components/game/ColorPicker";
import { WinnerModal } from "@/components/game/WinnerModal";
import { useGameState } from "@/hooks/useGameState";
import { useWebRTC } from "@/hooks/useWebRTC";
import { ArrowLeft } from "lucide-react";
import { makeOfflineAIDecision } from "@/lib/offlineAI";
import type { CardColor } from "@/hooks/useGameState";

const Game = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { playerName, playerEmoji = "😀", isSinglePlayer, isHost, isMultiplayer } = location.state || {};
  const [showUnoButton, setShowUnoButton] = useState(false);
  const [unoAnnouncement, setUnoAnnouncement] = useState<string | null>(null);
  const [drawingAnimation, setDrawingAnimation] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingWildCard, setPendingWildCard] = useState<number | null>(null);
  const [turnTimer, setTurnTimer] = useState(10);
  const [playingCardIndex, setPlayingCardIndex] = useState<number | null>(null);

  const { 
    gameState, 
    playCard, 
    drawCard, 
    canPlayCard,
    setGameState 
  } = useGameState(playerName, isSinglePlayer);

  const handleGameStateReceived = useCallback((message: any) => {
    console.log("Received message in game:", message);
    
    // Handle wrapped messages with type field
    if (message.type === "game_state") {
      setGameState(message.data);
    } else {
      // Handle direct game state (backwards compatibility)
      setGameState(message);
    }
  }, [setGameState]);

  const { broadcastGameState, isConnected, connectedPlayerCount } = useWebRTC(
    playerName, 
    handleGameStateReceived
  );

  if (!playerName) {
    navigate("/");
    return null;
  }

  // Turn timer
  useEffect(() => {
    if (gameState.winner || showColorPicker) return;
    
    setTurnTimer(10);
    const interval = setInterval(() => {
      setTurnTimer((prev) => {
        if (prev <= 1) {
          // Time's up - penalty: draw card and skip turn
          if (gameState.currentPlayerIndex === 0) {
            handleDrawCard();
          } else {
            // For AI players, just skip their turn
            setGameState(prevState => ({
              ...prevState,
              currentPlayerIndex: (prevState.currentPlayerIndex + prevState.direction + prevState.players.length) % prevState.players.length,
            }));
          }
          return 0; // Stay at 0 until turn changes
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.currentPlayerIndex, gameState.winner, showColorPicker]);

  // Check if player has 1 card - show UNO button
  useEffect(() => {
    const currentPlayer = gameState.players[0];
    if (currentPlayer?.hand.length === 1 && gameState.currentPlayerIndex === 0 && !gameState.winner) {
      setShowUnoButton(true);
    } else {
      setShowUnoButton(false);
    }
  }, [gameState.players, gameState.currentPlayerIndex, gameState.winner]);

  const handleUnoClick = () => {
    setShowUnoButton(false);
    setUnoAnnouncement(`${playerName} says UNO!`);
    setTimeout(() => setUnoAnnouncement(null), 3000);
  };

  const handleDrawCard = () => {
    if (gameState.currentPlayerIndex !== 0) return;
    
    setDrawingAnimation(true);
    const newState = drawCard();
    setTimeout(() => setDrawingAnimation(false), 500);
    
      // Broadcast state in multiplayer
      if (isMultiplayer && isHost && newState) {
        setTimeout(() => broadcastGameState({ type: "game_state", data: newState }), 100);
      }
  };

  const handlePlayCard = (cardIndex: number) => {
    if (gameState.currentPlayerIndex !== 0) return;
    
    const card = gameState.players[0].hand[cardIndex];
    
    // If it's a wild card, show color picker
    if (card.color === "wild") {
      setPendingWildCard(cardIndex);
      setShowColorPicker(true);
      return;
    }
    
    // Play animation
    setPlayingCardIndex(cardIndex);
    setTimeout(() => {
      const newState = playCard(cardIndex);
      setPlayingCardIndex(null);
      
      // Broadcast state in multiplayer
      if (isMultiplayer && isHost && newState) {
        setTimeout(() => broadcastGameState({ type: "game_state", data: newState }), 100);
      }
    }, 300);
  };

  const handleColorSelect = (color: CardColor) => {
    if (pendingWildCard === null) return;
    
    const card = gameState.players[0].hand[pendingWildCard];
    const coloredCard = { ...card, color };
    
    setGameState(prev => {
      const newPlayers = [...prev.players];
      newPlayers[0] = {
        ...newPlayers[0],
        hand: newPlayers[0].hand.filter((_, i) => i !== pendingWildCard),
      };

      // Check for winner
      if (newPlayers[0].hand.length === 0) {
        return {
          ...prev,
          players: newPlayers,
          winner: prev.players[0].name,
        };
      }

      let nextPlayerIndex = (prev.currentPlayerIndex + prev.direction + prev.players.length) % prev.players.length;
      
      // Handle +4
      if (card.value === "+4") {
        const drawnCards = prev.drawPile.slice(0, 4);
        newPlayers[nextPlayerIndex] = {
          ...newPlayers[nextPlayerIndex],
          hand: [...newPlayers[nextPlayerIndex].hand, ...drawnCards],
        };
        nextPlayerIndex = (nextPlayerIndex + prev.direction + prev.players.length) % prev.players.length;
      }

      const newState = {
        ...prev,
        players: newPlayers,
        currentCard: coloredCard,
        currentPlayerIndex: nextPlayerIndex,
        discardPile: [...prev.discardPile, coloredCard],
      };
      
      // Broadcast state in multiplayer
      if (isMultiplayer && isHost) {
        setTimeout(() => broadcastGameState({ type: "game_state", data: newState }), 100);
      }
      
      return newState;
    });
    
    setShowColorPicker(false);
    setPendingWildCard(null);
  };

  // AI player logic - runs when it's AI's turn (OFFLINE)
  useEffect(() => {
    if (!isSinglePlayer || gameState.currentPlayerIndex === 0 || gameState.winner) return;

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

          // Check if AI won
          if (newPlayers[prev.currentPlayerIndex].hand.length === 0) {
            return {
              ...prev,
              players: newPlayers,
              winner: currentPlayer.name,
            };
          }

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
  }, [gameState.currentPlayerIndex, isSinglePlayer, gameState.winner]);

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
          cardCount={gameState.players[1]?.hand.length || 0}
          position="top"
        />
      </div>

      {/* Left opponent */}
      <div className="absolute left-4 md:left-8 top-1/4 md:top-1/2 md:-translate-y-1/2">
        <PlayerDisplay
          name={gameState.players[2]?.name || "Player 3"}
          cardCount={gameState.players[2]?.hand.length || 0}
          position="left"
        />
      </div>

      {/* Right opponent */}
      <div className="absolute right-4 md:right-8 top-1/4 md:top-1/2 md:-translate-y-1/2">
        <PlayerDisplay
          name={gameState.players[3]?.name || "Player 4"}
          cardCount={gameState.players[3]?.hand.length || 0}
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
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-3xl">{playerEmoji}</span>
          <span className="text-white font-bold text-xl">{playerName}</span>
        </div>
        <div className="flex gap-2 md:gap-3 items-end max-w-full overflow-x-auto pb-2 justify-center">
          {gameState.players[0]?.hand.map((card, index) => (
            <div
              key={`${card.color}-${card.value}-${index}`}
              className={`transition-all duration-300 hover:-translate-y-6 cursor-pointer flex-shrink-0 ${
                canPlayCard(card) && !gameState.winner ? "" : "opacity-50 cursor-not-allowed"
              } ${playingCardIndex === index ? "scale-110 -translate-y-8 animate-pulse" : ""}`}
              onClick={() => canPlayCard(card) && !gameState.winner && handlePlayCard(index)}
            >
              <UnoCard color={card.color} value={card.value} size="md" />
            </div>
          ))}
        </div>
      </div>

      {/* Current player indicator with timer */}
      {!gameState.winner && (
        <div className="absolute bottom-56 md:bottom-48 left-1/2 -translate-x-1/2">
          {gameState.currentPlayerIndex === 0 ? (
            <div className="bg-accent text-white font-bold px-8 py-4 rounded-full shadow-lg animate-pulse text-xl flex items-center gap-3">
              <span>Your Turn</span>
              <span className="text-2xl">{turnTimer}s</span>
            </div>
          ) : (
            <div className="bg-white/80 text-foreground font-medium px-8 py-4 rounded-full shadow-lg text-xl flex items-center gap-3">
              <span>{gameState.players[gameState.currentPlayerIndex]?.name}'s Turn</span>
              <span className="text-2xl text-muted-foreground">{turnTimer}s</span>
            </div>
          )}
        </div>
      )}

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
          <div className="bg-accent text-white font-bold text-5xl px-12 py-6 rounded-3xl shadow-2xl border-4 border-white animate-pulse">
            {unoAnnouncement}
          </div>
        </div>
      )}

      {/* Color Picker */}
      {showColorPicker && <ColorPicker onSelectColor={handleColorSelect} />}

      {/* Winner Modal */}
      {gameState.winner && <WinnerModal winnerName={gameState.winner} />}

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

      {/* Multiplayer connection indicator */}
      {isMultiplayer && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg z-10">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span className="text-sm font-medium">
              {isConnected ? `${connectedPlayerCount + 1} Players` : 'Connecting...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
