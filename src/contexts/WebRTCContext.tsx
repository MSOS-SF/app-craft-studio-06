import React, { createContext, useContext, useMemo, useState } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";

// Types based on the hook return
type WebRTCContextValue = ReturnType<typeof useWebRTC> & {
  setPlayerName: (name: string) => void;
  setMessageHandler: (handler: ((msg: any) => void) | undefined) => void;
};

const WebRTCContext = createContext<WebRTCContextValue | undefined>(undefined);

interface ProviderProps {
  children: React.ReactNode;
}

export const WebRTCProvider: React.FC<ProviderProps> = ({ children }) => {
  const [playerName, setPlayerName] = useState<string>("");
  const [messageHandler, setMessageHandler] = useState<((msg: any) => void) | undefined>(
    undefined
  );

  // Initialize a SINGLE WebRTC instance for the whole app
  const webrtc = useWebRTC(playerName, messageHandler);

  const value = useMemo<WebRTCContextValue>(
    () => ({
      ...webrtc,
      setPlayerName,
      setMessageHandler,
    }),
    [webrtc]
  );

  return <WebRTCContext.Provider value={value}>{children}</WebRTCContext.Provider>;
};

export const useWebRTCContext = () => {
  const ctx = useContext(WebRTCContext);
  if (!ctx) throw new Error("useWebRTCContext must be used within WebRTCProvider");
  return ctx;
};
