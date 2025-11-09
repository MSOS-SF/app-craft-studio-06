import { supabase } from "@/integrations/supabase/client";

export const callAIPlayer = async (hand: any[], currentCard: any) => {
  try {
    const { data, error } = await supabase.functions.invoke('uno-ai-player', {
      body: { hand, currentCard }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error calling AI player:', error);
    return { action: "draw" };
  }
};