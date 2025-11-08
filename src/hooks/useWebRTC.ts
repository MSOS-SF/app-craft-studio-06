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
  
  // No STUN servers - works completely offline on local network
  const configuration: RTCConfiguration = {
    iceServers: [],
  };

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const [offerData, setOfferData] = useState<string>("");

  const createRoom = async (roomCode: string) => {
    console.log(`Creating room as host: ${roomCode}`);
    
    // Create peer connection
    peerConnectionRef.current = new RTCPeerConnection(configuration);
    
    // Create data channel
    dataChannelRef.current = peerConnectionRef.current.createDataChannel("game");
    
    dataChannelRef.current.onopen = () => {
      console.log("Data channel opened");
      setIsConnected(true);
      toast({
        title: "Player Connected",
        description: "A player has joined your game",
      });
    };
    
    dataChannelRef.current.onmessage = (event) => {
      console.log("Received message:", event.data);
    };
    
    // Create offer
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    
    // Wait for ICE gathering to complete
    await new Promise<void>((resolve) => {
      if (peerConnectionRef.current?.iceGatheringState === 'complete') {
        resolve();
      } else {
        peerConnectionRef.current!.onicegatheringstatechange = () => {
          if (peerConnectionRef.current?.iceGatheringState === 'complete') {
            resolve();
          }
        };
      }
    });
    
    // Generate connection string (offer + ICE candidates)
    const connectionData = {
      offer: peerConnectionRef.current.localDescription,
      hostId: localId,
      hostName: playerName,
    };
    
    const connectionString = btoa(JSON.stringify(connectionData));
    setOfferData(connectionString);
    
    toast({
      title: "Room Created",
      description: "Show the QR code to other players",
    });
    
    // Listen for answer
    peerConnectionRef.current.onicecandidate = (event) => {
      console.log("ICE candidate:", event.candidate);
    };
  };

  const joinRoom = async (connectionString: string) => {
    try {
      console.log(`Joining room with connection string`);
      
      // Decode connection data
      const connectionData = JSON.parse(atob(connectionString));
      
      // Create peer connection
      peerConnectionRef.current = new RTCPeerConnection(configuration);
      
      // Set up data channel handler
      peerConnectionRef.current.ondatachannel = (event) => {
        dataChannelRef.current = event.channel;
        
        dataChannelRef.current.onopen = () => {
          console.log("Data channel opened");
          setIsConnected(true);
          toast({
            title: "Connected",
            description: `Joined ${connectionData.hostName}'s game`,
          });
        };
        
        dataChannelRef.current.onmessage = (event) => {
          console.log("Received message:", event.data);
        };
      };
      
      // Set remote description (host's offer)
      await peerConnectionRef.current.setRemoteDescription(connectionData.offer);
      
      // Create answer
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      // Wait for ICE gathering
      await new Promise<void>((resolve) => {
        if (peerConnectionRef.current?.iceGatheringState === 'complete') {
          resolve();
        } else {
          peerConnectionRef.current!.onicegatheringstatechange = () => {
            if (peerConnectionRef.current?.iceGatheringState === 'complete') {
              resolve();
            }
          };
        }
      });
      
      // In a real app, you'd send this answer back to the host
      // For now, we'll store it and the host would need to manually apply it
      const answerData = {
        answer: peerConnectionRef.current.localDescription,
        peerId: localId,
        peerName: playerName,
      };
      
      console.log("Answer created:", answerData);
      // The answer needs to be sent to host somehow - this is the limitation
      // In a local hotspot, you could use a simple HTTP server on the host device
      
    } catch (error) {
      console.error("Error joining room:", error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to host",
        variant: "destructive",
      });
    }
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

  const applyAnswer = async (answerString: string) => {
    try {
      const answerData = JSON.parse(atob(answerString));
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(answerData.answer);
        console.log("Answer applied successfully");
      }
    } catch (error) {
      console.error("Error applying answer:", error);
    }
  };

  return {
    localId,
    peers,
    isConnected,
    offerData,
    createRoom,
    joinRoom,
    applyAnswer,
    sendMessage,
    broadcastGameState,
  };
};
