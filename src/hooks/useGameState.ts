import { useState, useCallback } from "react";

export type CardColor = "red" | "yellow" | "green" | "blue" | "wild";
export type CardValue = number | "skip" | "reverse" | "+2" | "wild" | "+4";

export interface Card {
  color: CardColor;
  value: CardValue;
}

export interface Player {
  name: string;
  hand: Card[];
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  currentCard: Card | null;
  drawPile: Card[];
  discardPile: Card[];
  direction: 1 | -1;
  winner: string | null;
}

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  const colors: CardColor[] = ["red", "yellow", "green", "blue"];
  
  // Number cards (0-9)
  colors.forEach(color => {
    deck.push({ color, value: 0 });
    for (let i = 1; i <= 9; i++) {
      deck.push({ color, value: i });
      deck.push({ color, value: i });
    }
  });

  // Action cards
  colors.forEach(color => {
    for (let i = 0; i < 2; i++) {
      deck.push({ color, value: "skip" });
      deck.push({ color, value: "reverse" });
      deck.push({ color, value: "+2" });
    }
  });

  // Wild cards
  for (let i = 0; i < 4; i++) {
    deck.push({ color: "wild", value: "wild" });
    deck.push({ color: "wild", value: "+4" });
  }

  return shuffleDeck(deck);
};

const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const useGameState = (playerName: string, isSinglePlayer: boolean = false) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const deck = createDeck();
    const players: Player[] = isSinglePlayer
      ? [
          { name: playerName, hand: deck.splice(0, 7) },
          { name: "AI Player 1", hand: deck.splice(0, 7) },
          { name: "AI Player 2", hand: deck.splice(0, 7) },
          { name: "AI Player 3", hand: deck.splice(0, 7) },
        ]
      : [
          { name: playerName, hand: deck.splice(0, 7) },
          { name: "Player 2", hand: deck.splice(0, 7) },
          { name: "Player 3", hand: deck.splice(0, 7) },
          { name: "Player 4", hand: deck.splice(0, 7) },
        ];

    const startCard = deck.find(card => typeof card.value === "number") || deck[0];
    const startIndex = deck.indexOf(startCard);
    const currentCard = deck.splice(startIndex, 1)[0];

    return {
      players,
      currentPlayerIndex: 0,
      currentCard,
      drawPile: deck,
      discardPile: [currentCard],
      direction: 1,
      winner: null,
    };
  });

  const canPlayCard = useCallback((card: Card): boolean => {
    if (!gameState.currentCard || gameState.currentPlayerIndex !== 0) return false;
    
    // Allow wild cards, same color, OR same value (regardless of color for number stacking)
    return (
      card.color === "wild" ||
      card.color === gameState.currentCard.color ||
      card.value === gameState.currentCard.value
    );
  }, [gameState.currentCard, gameState.currentPlayerIndex]);

  const playCard = useCallback((cardIndex: number) => {
    if (gameState.currentPlayerIndex !== 0) return;

    setGameState(prev => {
      const card = prev.players[0].hand[cardIndex];
      if (!canPlayCard(card)) return prev;

      const newPlayers = [...prev.players];
      newPlayers[0] = {
        ...newPlayers[0],
        hand: newPlayers[0].hand.filter((_, i) => i !== cardIndex),
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
        currentCard: card,
        currentPlayerIndex: nextPlayerIndex,
        direction: newDirection,
        discardPile: [...prev.discardPile, card],
      };
    });
  }, [gameState.currentPlayerIndex, canPlayCard]);

  const drawCard = useCallback(() => {
    if (gameState.currentPlayerIndex !== 0 || gameState.drawPile.length === 0) return;

    setGameState(prev => {
      const drawnCard = prev.drawPile[0];
      const newPlayers = [...prev.players];
      newPlayers[0] = {
        ...newPlayers[0],
        hand: [...newPlayers[0].hand, drawnCard],
      };

      return {
        ...prev,
        players: newPlayers,
        drawPile: prev.drawPile.slice(1),
        currentPlayerIndex: (prev.currentPlayerIndex + prev.direction + prev.players.length) % prev.players.length,
      };
    });
  }, [gameState.currentPlayerIndex, gameState.drawPile.length]);

  return {
    gameState,
    playCard,
    drawCard,
    canPlayCard,
    isSinglePlayer,
    setGameState,
  };
};
