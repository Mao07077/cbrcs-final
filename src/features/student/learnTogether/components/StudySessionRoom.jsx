import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  MessageSquare, 
  Users, 
  Hand,
  Monitor,
  MonitorOff,
  Settings
} from "lucide-react";

const StudySessionRoom = ({ sessionInfo, userId, userName, onLeaveSession }) => {
  // WebSocket connection
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  
  // Room state
  const [participants, setParticipants] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);
  
  // Local media state
  const [isMuted, setIsMuted] = useState(true);
  const [isCameraOff, setIsCameraOff] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(false);
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  
  // Refs
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const chatContainerRef = useRef(null);

  // WebSocket connection setup
  useEffect(() => {
    if (!sessionInfo) return;

    // Connect to the backend WebSocket server (port 8000), not the frontend dev server
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:8000${sessionInfo.websocket_url}`;
    
    console.log("Connecting to WebSocket:", wsUrl);
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setConnectionStatus("connected");
      
      // Send initial connection data
      ws.send(JSON.stringify({
        user_id: userId,
        user_name: userName
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setConnectionStatus("disconnected");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("error");
    };

    setSocket(ws);

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [sessionInfo, userId, userName]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case "connection_established":
        console.log("Connection established:", data);
        setRoomInfo(data.room_info);
        break;
        
      case "participants_update":
        setParticipants(data.participants);
        setRoomInfo(data.room_info);
        break;
        
      case "chat_message":
        setChatMessages(prev => [...prev, data.message]);
        // Auto-scroll chat to bottom
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 100);
        break;
        
      case "chat_history":
        setChatMessages(data.messages);
        break;
        
      case "hand_raise_update":
        // Handle hand raise notifications (you could show a toast here)
        console.log(`${data.participant_name} ${data.hand_raised ? 'raised' : 'lowered'} their hand`);
        break;
        
      case "error":
        console.error("Server error:", data.message);
        alert(data.message);
        break;
        
      default:
        console.log("Unknown message type:", data.type);
    }
  }, []);

  // Media controls
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
        
        // Send status update
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: "status_update",
            muted: !isMuted
          }));
        }
      }
    }
  }, [isMuted]);

  const toggleCamera = useCallback(async () => {
    try {
      if (isCameraOff) {
        // Turn camera on
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: !isMuted 
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } else {
        // Turn camera off
        if (localStreamRef.current) {
          localStreamRef.current.getVideoTracks().forEach(track => track.stop());
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
      }
      
      setIsCameraOff(!isCameraOff);
      
      // Send status update
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: "status_update",
          camera_off: !isCameraOff
        }));
      }
    } catch (error) {
      console.error("Camera toggle error:", error);
      alert("Failed to access camera. Please check permissions.");
    }
  }, [isCameraOff, isMuted]);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        // Start screen share
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true, 
          audio: true 
        });
        
        // Handle when user stops screen share via browser controls
        stream.getVideoTracks()[0].addEventListener('ended', () => {
          setIsScreenSharing(false);
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: "status_update",
              is_screen_sharing: false
            }));
          }
        });
        
        setIsScreenSharing(true);
      } else {
        // Stop screen share
        setIsScreenSharing(false);
      }
      
      // Send status update
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: "status_update",
          is_screen_sharing: !isScreenSharing
        }));
      }
    } catch (error) {
      console.error("Screen share error:", error);
    }
  }, [isScreenSharing]);

  const toggleHandRaise = useCallback(() => {
    const newHandRaisedState = !handRaised;
    setHandRaised(newHandRaisedState);
    
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "hand_raise",
        hand_raised: newHandRaisedState
      }));
    }
  }, [handRaised]);

  // Chat functions
  const sendMessage = useCallback(() => {
    if (newMessage.trim() && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: "chat_message",
        message: newMessage.trim()
      }));
      setNewMessage("");
    }
  }, [newMessage]);

  const handleMessageKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Clean up media streams on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (connectionStatus === "connecting") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Connecting to study session...</p>
        </div>
      </div>
    );
  }

  if (connectionStatus === "error") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Connection Error</h2>
          <p className="mb-4">Failed to connect to the study session.</p>
          <button 
            onClick={onLeaveSession}
            className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Back to Study Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">{roomInfo?.group_title}</h1>
          <p className="text-sm text-gray-300">{roomInfo?.group_subject}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span>{participants.length} participants</span>
          </div>
          <button
            onClick={onLeaveSession}
            className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <Phone className="w-4 h-4" />
            Leave Session
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex">
        {/* Video area */}
        <div className="flex-1 p-4">
          {/* Local video preview */}
          <div className="mb-4">
            <div className="relative bg-gray-800 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', maxWidth: '300px' }}>
              {!isCameraOff ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <VideoOff className="w-12 h-12" />
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                You {isMuted && <span className="text-red-400">(Muted)</span>}
              </div>
            </div>
          </div>

          {/* Participants grid - placeholder for future WebRTC implementation */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {participants.filter(p => p.user_id !== userId).map((participant) => (
              <div key={participant.id} className="relative bg-gray-800 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <div className="w-full h-full flex items-center justify-center text-white">
                  <VideoOff className="w-8 h-8" />
                </div>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  {participant.name}
                  {participant.muted && <span className="text-red-400 ml-1">(Muted)</span>}
                  {participant.is_screen_sharing && <span className="text-green-400 ml-1">(Sharing)</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat sidebar */}
        {showChat && (
          <div className="w-80 bg-gray-800 text-white flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-bold">Chat</h3>
            </div>
            
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((message) => (
                <div key={message.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm">{message.sender_name}</span>
                    <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
                  </div>
                  <p className="text-sm">{message.message}</p>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleMessageKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="bg-gray-800 p-4 flex justify-center items-center gap-4">
        <button
          onClick={toggleMute}
          className={`p-3 rounded-full ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'}`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
        </button>

        <button
          onClick={toggleCamera}
          className={`p-3 rounded-full ${isCameraOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'}`}
          title={isCameraOff ? "Turn camera on" : "Turn camera off"}
        >
          {isCameraOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full ${isScreenSharing ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
          title={isScreenSharing ? "Stop sharing" : "Share screen"}
        >
          {isScreenSharing ? <MonitorOff className="w-6 h-6 text-white" /> : <Monitor className="w-6 h-6 text-white" />}
        </button>

        <button
          onClick={toggleHandRaise}
          className={`p-3 rounded-full ${handRaised ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'}`}
          title={handRaised ? "Lower hand" : "Raise hand"}
        >
          <Hand className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={() => setShowChat(!showChat)}
          className={`p-3 rounded-full ${showChat ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}`}
          title="Toggle chat"
        >
          <MessageSquare className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-3 rounded-full bg-gray-600 hover:bg-gray-700"
          title="Settings"
        >
          <Settings className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};

export default StudySessionRoom;
