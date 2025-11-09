import { Card, CardColor } from "@/hooks/useGameState";

export interface AIDecision {
  action: "play" | "draw";
  cardIndex?: number;
  newColor?: CardColor;
}

export const makeOfflineAIDecision = (hand: Card[], currentCard: Card): AIDecision => {
  // Find all playable cards
  const playableCards = hand
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => 
      card.color === "wild" || 
      card.color === currentCard.color || 
      card.value === currentCard.value
    );

  if (playableCards.length === 0) {
    return { action: "draw" };
  }

  // Prioritize special cards (skip, reverse, +2, +4, wild)
  const specialCards = playableCards.filter(({ card }) => 
    typeof card.value !== "number"
  );

  const chosenCard = specialCards.length > 0 ? specialCards[0] : playableCards[0];

  // If it's a wild card, choose color based on most common in hand
  if (chosenCard.card.color === "wild") {
    const colorCounts = { red: 0, yellow: 0, green: 0, blue: 0 };
    hand.forEach(card => {
      if (card.color !== "wild") {
        colorCounts[card.color]++;
      }
    });

    const bestColor = (Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0][0] as CardColor) || "red";
    
    return {
      action: "play",
      cardIndex: chosenCard.index,
      newColor: bestColor
    };
  }

  return {
    action: "play",
    cardIndex: chosenCard.index
  };
};