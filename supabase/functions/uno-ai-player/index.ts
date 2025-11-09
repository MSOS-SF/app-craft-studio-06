import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hand, currentCard } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an UNO card game AI. You must decide which card to play from your hand.

Rules:
- You can play a card if it matches the current card's color OR value
- Wild cards (color: "wild") can be played anytime and you choose the new color
- If you can't play, return { action: "draw" }
- If you can play, return { action: "play", cardIndex: <index>, newColor: <color if wild> }
- Choose strategically: play high-value cards first (skip, reverse, draw two, wild draw four)
- New color choices should be based on cards you have most of

Respond ONLY with valid JSON matching this format:
{ "action": "play", "cardIndex": 0, "newColor": "red" }
OR
{ "action": "draw" }`;

    const prompt = `Current card on table: ${JSON.stringify(currentCard)}
My hand: ${JSON.stringify(hand)}

What should I play? Remember to respond with valid JSON only.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      // Fallback to simple logic if AI fails
      const validCards = hand
        .map((card: any, index: number) => ({ card, index }))
        .filter(({ card }: any) => 
          card.color === "wild" || 
          card.color === currentCard.color || 
          card.value === currentCard.value
        );

      if (validCards.length > 0) {
        const chosen = validCards[0];
        const decision: any = { action: "play", cardIndex: chosen.index };
        
        if (chosen.card.color === "wild") {
          const colors = ["red", "yellow", "green", "blue"];
          decision.newColor = colors[Math.floor(Math.random() * colors.length)];
        }
        
        return new Response(JSON.stringify(decision), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ action: "draw" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Parse AI response
    let decision;
    try {
      // Extract JSON from response (in case AI adds explanation)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      decision = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiResponse);
    } catch (e) {
      console.error("Failed to parse AI response:", aiResponse);
      // Fallback
      decision = { action: "draw" };
    }

    console.log("AI Decision:", decision);

    return new Response(JSON.stringify(decision), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in uno-ai-player:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage, action: "draw" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});