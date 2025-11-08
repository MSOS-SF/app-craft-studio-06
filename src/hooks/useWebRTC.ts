import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";

interface Peer {
  id: string;
  name: string;
  connection: RTCPeerConnection;
  channel: RTCDataChannel;
}

export const useWebRTC = (playerName: string) => {
  const [localId] = useState(() => Math.random().toString(36).substring(7));
  const [peers, setPeers] = useState<Peer[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  
  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  const createRoom = async (roomCode: string) => {
    console.log(`Creating room: ${roomCode}`);
    // In a real implementation, this would set up a signaling mechanism
    // For now, we'll use localStorage as a simple local signaling method
    localStorage.setItem(`room_${roomCode}`, JSON.stringify({
      hostId: localId,
      hostName: playerName,
      created: Date.now(),
    }));
    
    toast({
      title: "Room Created",
      description: `Room ${roomCode} is ready for players`,
    });
  };

  const joinRoom = async (roomCode: string) => {
    console.log(`Joining room: ${roomCode}`);
    const roomData = localStorage.getItem(`room_${roomCode}`);
    
    if (!roomData) {
      toast({
        title: "Room Not Found",
        description: "Please check the room code and try again",
        variant: "destructive",
      });
      return;
    }

    const room = JSON.parse(roomData);
    console.log(`Found room hosted by ${room.hostName}`);
    
    // Simulate connection for demo
    setTimeout(() => {
      setIsConnected(true);
      toast({
        title: "Connected",
        description: `Joined ${room.hostName}'s game`,
      });
    }, 1000);
  };

  const sendMessage = (message: any) => {
    peers.forEach(peer => {
      if (peer.channel.readyState === "open") {
        peer.channel.send(JSON.stringify(message));
      }
    });
  };

  const broadcastGameState = (gameState: any) => {
    sendMessage({ type: "game_state", data: gameState });
  };

  return {
    localId,
    peers,
    isConnected,
    createRoom,
    joinRoom,
    sendMessage,
    broadcastGameState,
  };
};
