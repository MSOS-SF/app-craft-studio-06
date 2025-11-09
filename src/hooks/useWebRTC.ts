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

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null); // joiner-side connection
  const dataChannelRef = useRef<RTCDataChannel | null>(null); // joiner-side channel
  // Host-side pending connection/channel used to generate an offer for the next player
  const hostPendingConnectionRef = useRef<RTCPeerConnection | null>(null);
  const hostPendingChannelRef = useRef<RTCDataChannel | null>(null);
  const currentRoomCodeRef = useRef<string>("");
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

  // Host: generate a fresh offer to be shared with the next player
  const generateHostOffer = async (roomCode: string) => {
    const pc = new RTCPeerConnection(configuration);
    const channel = pc.createDataChannel("game");

    channel.onopen = () => {
      console.log("Host data channel opened");
    };
    channel.onmessage = (event) => {
      handleIncomingMessage(event.data);
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await new Promise<void>((resolve) => {
      if (pc.iceGatheringState === 'complete') resolve();
      else pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') resolve();
      };
    });

    hostPendingConnectionRef.current = pc;
    hostPendingChannelRef.current = channel;

    const connectionData = {
      r: roomCode,
      i: localId,
      n: playerName,
      o: pc.localDescription,
    };

    const jsonStr = JSON.stringify(connectionData);
    const compressed = pako.deflate(jsonStr);
    const connectionString = btoa(String.fromCharCode(...compressed));
    setOfferData(connectionString);
  };
  const handleIncomingMessage = useCallback((message: string) => {
    try {
      const data = JSON.parse(message);
      console.log("Received message:", data);
      
      if (messageHandlerRef.current) {
        messageHandlerRef.current(data);
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  }, []);

  const createRoom = async (roomCode: string) => {
    console.log(`Creating room as host: ${roomCode}`);
    currentRoomCodeRef.current = roomCode;

    await generateHostOffer(roomCode);

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

      const pc = hostPendingConnectionRef.current;
      const channel = hostPendingChannelRef.current;

      if (!pc || !channel || !answerData?.a) {
        toast({
          title: "Connection Failed",
          description: "Invalid or expired invitation. Create a new QR and try again.",
          variant: "destructive",
        });
        return;
      }

      await pc.setRemoteDescription(answerData.a as RTCSessionDescriptionInit);

      const newPeer: Peer = {
        id: answerData.i,
        name: answerData.n || `Player ${peersRef.current.length + 2}`,
        connection: pc,
        channel,
      };

      // When channel opens, update connected state
      channel.onopen = () => {
        console.log(`Data channel opened for ${newPeer.name}`);
        setIsConnected(true);
        toast({
          title: "Player Connected",
          description: `${newPeer.name} joined the game`,
        });
      };
      channel.onmessage = (event) => handleIncomingMessage(event.data);

      setPeers(prev => [...prev, newPeer]);
      console.log(`Peer ${newPeer.name} added successfully`);

      // Prepare next invitation if room isn't full yet
      if (peersRef.current.length + 1 < 4 && currentRoomCodeRef.current) {
        await generateHostOffer(currentRoomCodeRef.current);
      } else {
        setOfferData("");
      }

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
