import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import pako from "pako";

interface Peer {
  id: string;
  name: string;
  connection: RTCPeerConnection;
  channel: RTCDataChannel;
}

export const useWebRTC = (playerName: string, onGameStateReceived?: (gameState: any) => void) => {
  const [localId] = useState(() => Math.random().toString(36).substring(7));
  const [peers, setPeers] = useState<Peer[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const messageHandlerRef = useRef(onGameStateReceived);
  
  // No STUN servers - works completely offline on local network
  const configuration: RTCConfiguration = {
    iceServers: [],
  };

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const [offerData, setOfferData] = useState<string>("");

  // Update message handler ref when callback changes
  useEffect(() => {
    messageHandlerRef.current = onGameStateReceived;
  }, [onGameStateReceived]);

  const handleIncomingMessage = useCallback((message: string) => {
    try {
      const data = JSON.parse(message);
      console.log("Received message:", data);
      
      if (data.type === "game_state" && messageHandlerRef.current) {
        messageHandlerRef.current(data.data);
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  }, []);

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
      handleIncomingMessage(event.data);
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
    
    // Generate connection string with compressed data and short keys
    const connectionData = {
      o: peerConnectionRef.current.localDescription,
      i: localId,
      n: playerName,
    };
    
    // Compress and encode
    const jsonStr = JSON.stringify(connectionData);
    const compressed = pako.deflate(jsonStr);
    const connectionString = btoa(String.fromCharCode(...compressed));
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
      
      // Decompress and decode connection data
      const compressed = Uint8Array.from(atob(connectionString), c => c.charCodeAt(0));
      const decompressed = pako.inflate(compressed, { to: 'string' });
      const connectionData = JSON.parse(decompressed);
      
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
            description: `Joined ${connectionData.n}'s game`,
          });
        };
        
        dataChannelRef.current.onmessage = (event) => {
          handleIncomingMessage(event.data);
        };
      };
      
      // Set remote description (host's offer)
      await peerConnectionRef.current.setRemoteDescription(connectionData.o);
      
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
      
      // Create compressed answer for host
      const answerData = {
        a: peerConnectionRef.current.localDescription,
        i: localId,
        n: playerName,
      };
      
      const answerJson = JSON.stringify(answerData);
      const answerCompressed = pako.deflate(answerJson);
      const answerString = btoa(String.fromCharCode(...answerCompressed));
      setOfferData(answerString);
      
      console.log("Answer created");
      
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
    // Send through data channel if it exists and is open
    if (dataChannelRef.current && dataChannelRef.current.readyState === "open") {
      console.log("Sending message:", message);
      dataChannelRef.current.send(JSON.stringify(message));
      return;
    }
    
    // Fallback to peers array
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
      const compressed = Uint8Array.from(atob(answerString), c => c.charCodeAt(0));
      const decompressed = pako.inflate(compressed, { to: 'string' });
      const answerData = JSON.parse(decompressed);
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(answerData.a);
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
