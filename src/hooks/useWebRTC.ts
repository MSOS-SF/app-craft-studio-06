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
  const [connectedPlayerCount, setConnectedPlayerCount] = useState(0);
  const { toast } = useToast();
  const messageHandlerRef = useRef(onGameStateReceived);
  const peersRef = useRef<Peer[]>([]);
  
  // No STUN servers - works completely offline on local network
  const configuration: RTCConfiguration = {
    iceServers: [],
  };

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const [offerData, setOfferData] = useState<string>("");
  
  // Keep peersRef in sync with peers state
  useEffect(() => {
    peersRef.current = peers;
    setConnectedPlayerCount(peers.length);
    setIsConnected(peers.length > 0);
  }, [peers]);

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
    
    // Create a temporary peer connection to generate offer
    const tempConnection = new RTCPeerConnection(configuration);
    const tempChannel = tempConnection.createDataChannel("game");
    
    // Create offer
    const offer = await tempConnection.createOffer();
    await tempConnection.setLocalDescription(offer);
    
    // Wait for ICE gathering
    await new Promise<void>((resolve) => {
      if (tempConnection.iceGatheringState === 'complete') {
        resolve();
      } else {
        tempConnection.onicegatheringstatechange = () => {
          if (tempConnection.iceGatheringState === 'complete') {
            resolve();
          }
        };
      }
    });
    
    // Generate shareable offer that multiple players can use
    const connectionData = {
      r: roomCode,
      i: localId,
      n: playerName,
      o: tempConnection.localDescription,
    };
    
    // Clean up temp connection (we'll create new ones for each joiner)
    tempConnection.close();
    
    // Compress and encode
    const jsonStr = JSON.stringify(connectionData);
    const compressed = pako.deflate(jsonStr);
    const connectionString = btoa(String.fromCharCode(...compressed));
    setOfferData(connectionString);
    
    toast({
      title: "Room Created",
      description: "Up to 3 players can scan this QR code to join",
    });
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
    // As joiner, send through data channel
    if (dataChannelRef.current && dataChannelRef.current.readyState === "open") {
      console.log("Sending message:", message);
      dataChannelRef.current.send(JSON.stringify(message));
      return;
    }
    
    // As host, broadcast to all connected peers
    peersRef.current.forEach(peer => {
      if (peer.channel.readyState === "open") {
        console.log(`Broadcasting to peer ${peer.name}:`, message);
        peer.channel.send(JSON.stringify(message));
      }
    });
  };

  const broadcastGameState = (gameState: any) => {
    sendMessage({ type: "game_state", data: gameState });
  };

  const applyAnswer = async (answerString: string) => {
    try {
      if (peersRef.current.length >= 3) {
        toast({
          title: "Room Full",
          description: "Maximum 4 players (host + 3 joiners)",
          variant: "destructive",
        });
        return;
      }

      const compressed = Uint8Array.from(atob(answerString), c => c.charCodeAt(0));
      const decompressed = pako.inflate(compressed, { to: 'string' });
      const answerData = JSON.parse(decompressed);
      
      // Create new peer connection for this player
      const newPeerConnection = new RTCPeerConnection(configuration);
      const newPeerId = answerData.i;
      const newPeerName = answerData.n || `Player ${peersRef.current.length + 2}`;
      
      // Create data channel
      const newChannel = newPeerConnection.createDataChannel("game");
      
      newChannel.onopen = () => {
        console.log(`Data channel opened for ${newPeerName}`);
        toast({
          title: "Player Connected",
          description: `${newPeerName} joined the game`,
        });
      };
      
      newChannel.onmessage = (event) => {
        handleIncomingMessage(event.data);
      };
      
      // Create offer for this specific peer
      const offer = await newPeerConnection.createOffer();
      await newPeerConnection.setLocalDescription(offer);
      
      // Wait for ICE gathering
      await new Promise<void>((resolve) => {
        if (newPeerConnection.iceGatheringState === 'complete') {
          resolve();
        } else {
          newPeerConnection.onicegatheringstatechange = () => {
            if (newPeerConnection.iceGatheringState === 'complete') {
              resolve();
            }
          };
        }
      });
      
      // Set remote description (player's answer)
      await newPeerConnection.setRemoteDescription(answerData.a);
      
      // Add to peers
      const newPeer: Peer = {
        id: newPeerId,
        name: newPeerName,
        connection: newPeerConnection,
        channel: newChannel,
      };
      
      setPeers(prev => [...prev, newPeer]);
      console.log(`Peer ${newPeerName} added successfully`);
      
    } catch (error) {
      console.error("Error applying answer:", error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to player",
        variant: "destructive",
      });
    }
  };

  return {
    localId,
    peers,
    isConnected,
    connectedPlayerCount,
    offerData,
    createRoom,
    joinRoom,
    applyAnswer,
    sendMessage,
    broadcastGameState,
  };
};
