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
import useLearnTogetherStore from "../../../../store/student/learnTogetherStore";
import SessionEndNotification from "../../../../components/common/SessionEndNotification";

const StudySessionRoom = ({ sessionInfo, userId, userName, onLeaveSession }) => {
  const { leaveSession } = useLearnTogetherStore();
  
  // Add notification state
  const [showEndNotification, setShowEndNotification] = useState(false);
  const [endNotificationMessage, setEndNotificationMessage] = useState("");
  const [endNotificationType, setEndNotificationType] = useState("success");
  // WebSocket connection
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  
  // Local media state (define these BEFORE using them)
  const [isMuted, setIsMuted] = useState(true);
  const [isCameraOff, setIsCameraOff] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  
  // Room state
  const [participants, setParticipants] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);

  // Initialize participants with current user
  useEffect(() => {
    if (userId && userName) {
      setParticipants([{
        id: `user_${userId}`,
        user_id: userId,
        name: userName,
        muted: isMuted,
        camera_off: isCameraOff,
        is_screen_sharing: isScreenSharing
      }]);
    }
  }, [userId, userName, isMuted, isCameraOff, isScreenSharing]);
  
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
  const peerConnectionsRef = useRef(new Map()); // Store peer connections
  const remoteVideosRef = useRef(new Map()); // Store remote video refs

  // Initialize media on component mount
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        // Start with audio and video off, but get permission
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: false
        });
        
        // Stop the tracks immediately since we start muted/camera off
        stream.getTracks().forEach(track => track.stop());
        
        console.log("Media permissions granted");
        setMediaError(null);
      } catch (error) {
        console.error("Failed to get media permissions:", error);
        setMediaError("Unable to access camera/microphone. Please check your permissions.");
      }
    };

    initializeMedia();
  }, []);

  // Initialize media when component loads
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        // Start with audio only initially 
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: false, // Start with camera off
          audio: true   // Start with mic muted but available
        });
        
        localStreamRef.current = stream;
        
        // Mute audio by default
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = false; // Muted by default
        }
        
      } catch (error) {
        console.error("Failed to initialize media:", error);
        // Continue without media if permission denied
      }
    };

    initializeMedia();
  }, []); // Run once on mount

  // WebSocket connection setup
  useEffect(() => {
    if (!sessionInfo) return;

    const initializeSession = async () => {
      try {
        // Just join the existing active session
        const { joinSession } = useLearnTogetherStore.getState();
        await joinSession(sessionInfo.group.id);

        // Now establish WebSocket connection
        const baseUrl = (import.meta.env.VITE_API_URL || "https://cbrcs-final.onrender.com").replace(/\/$/, '');
        const wsBaseUrl = baseUrl.replace(/^http/, 'ws');
        console.log("Base URL:", baseUrl);
        console.log("WS Base URL:", wsBaseUrl);
        console.log("WebSocket URL from backend:", sessionInfo.websocket_url);
        
        // Ensure websocket_url starts with / and remove any double slashes
        let websocketPath = sessionInfo.websocket_url;
        if (!websocketPath.startsWith('/')) {
          websocketPath = '/' + websocketPath;
        }
        console.log("WebSocket path after processing:", websocketPath);
        
        const wsUrl = `${wsBaseUrl}${websocketPath}`;
        
        console.log("Final WebSocket URL:", wsUrl);
        
        console.log("Connecting to WebSocket:", wsUrl);
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket connected");
          setConnectionStatus("connected");
          
          // Send initial connection data with current media state
          ws.send(JSON.stringify({
            type: "join_session",
            user_id: userId,
            user_name: userName,
            muted: isMuted,
            camera_off: isCameraOff,
            is_screen_sharing: isScreenSharing,
            hand_raised: handRaised
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
      } catch (error) {
        console.error("Failed to initialize session:", error);
        setConnectionStatus("error");
      }
    };

    initializeSession();

    return () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
    };
  }, [sessionInfo, userId, userName]);

  // Activity updater to keep session alive
  useEffect(() => {
    if (!sessionInfo?.group?.id) return;

    const updateActivity = async () => {
      try {
        const response = await fetch('/api/study-groups/update-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            group_id: sessionInfo.group.id
          })
        });
        
        if (!response.ok) {
          console.warn('Failed to update activity:', response.status);
        }
      } catch (error) {
        console.warn('Error updating activity:', error);
      }
    };

    // Update activity immediately
    updateActivity();

    // Set up interval to update every 2 minutes (keeps sessions alive)
    const activityInterval = setInterval(updateActivity, 2 * 60 * 1000);

    return () => {
      clearInterval(activityInterval);
    };
  }, [sessionInfo?.group?.id]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case "connection_established":
        console.log("Connection established:", data);
        setRoomInfo(data.room_info);
        break;
        
      case "participants_update":
        console.log("Participants update:", data.participants);
        // Always include current user in participants list
        const currentUser = {
          id: `user_${userId}`,
          user_id: userId,
          name: userName,
          muted: isMuted,
          camera_off: isCameraOff,
          is_screen_sharing: isScreenSharing
        };
        
        // Filter out current user from server data and add our local version
        const otherParticipants = data.participants.filter(p => p.user_id !== userId);
        const allParticipants = [currentUser, ...otherParticipants];
        
        setParticipants(allParticipants);
        setRoomInfo(data.room_info);
        // Handle new participants for WebRTC connections
        handleParticipantsUpdate(allParticipants);
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
        
      case "webrtc_offer":
      case "webrtc_answer":
      case "webrtc_ice_candidate":
        // Handle WebRTC signaling
        handleWebRTCSignaling(data);
        break;
        
      case "error":
        console.error("Server error:", data.message);
        alert(data.message);
        break;
        
      default:
        console.log("Unknown message type:", data.type);
    }
  }, []);

  // WebRTC functions
  const createPeerConnection = useCallback((participantId) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Add local stream to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      const videoElement = remoteVideosRef.current.get(participantId);
      if (videoElement) {
        videoElement.srcObject = remoteStream;
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: "webrtc_ice_candidate",
          target_participant_id: participantId,
          data: { candidate: event.candidate }
        }));
      }
    };

    peerConnectionsRef.current.set(participantId, peerConnection);
    return peerConnection;
  }, []);

  const handleParticipantsUpdate = useCallback(async (newParticipants) => {
    const currentParticipantIds = new Set(participants.map(p => p.id));
    const newParticipantIds = new Set(newParticipants.map(p => p.id));

    // Handle new participants (create offers)
    for (const participant of newParticipants) {
      if (participant.user_id !== userId && !currentParticipantIds.has(participant.id)) {
        try {
          const peerConnection = createPeerConnection(participant.id);
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);

          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: "webrtc_offer",
              target_participant_id: participant.id,
              data: { offer }
            }));
          }
        } catch (error) {
          console.error("Error creating offer:", error);
        }
      }
    }

    // Clean up disconnected participants
    for (const participantId of currentParticipantIds) {
      if (!newParticipantIds.has(participantId)) {
        const peerConnection = peerConnectionsRef.current.get(participantId);
        if (peerConnection) {
          peerConnection.close();
          peerConnectionsRef.current.delete(participantId);
        }
        remoteVideosRef.current.delete(participantId);
      }
    }
  }, [participants, userId, createPeerConnection]);

  const handleWebRTCSignaling = useCallback(async (data) => {
    const { type, from_participant_id, data: signalData } = data;

    try {
      let peerConnection = peerConnectionsRef.current.get(from_participant_id);

      if (type === "webrtc_offer") {
        if (!peerConnection) {
          peerConnection = createPeerConnection(from_participant_id);
        }

        await peerConnection.setRemoteDescription(signalData.offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: "webrtc_answer",
            target_participant_id: from_participant_id,
            data: { answer }
          }));
        }
      } else if (type === "webrtc_answer" && peerConnection) {
        await peerConnection.setRemoteDescription(signalData.answer);
      } else if (type === "webrtc_ice_candidate" && peerConnection) {
        await peerConnection.addIceCandidate(signalData.candidate);
      }
    } catch (error) {
      console.error("WebRTC signaling error:", error);
    }
  }, [createPeerConnection]);

  // Media controls
  const toggleMute = useCallback(async () => {
    try {
      if (isMuted) {
        // Turn microphone on
        if (!localStreamRef.current || !localStreamRef.current.getAudioTracks().length) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: true, 
            video: !isCameraOff 
          });
          
          if (localStreamRef.current) {
            // Replace existing stream
            localStreamRef.current.getTracks().forEach(track => track.stop());
          }
          
          localStreamRef.current = stream;
          if (localVideoRef.current && !isCameraOff) {
            localVideoRef.current.srcObject = stream;
          }
        } else {
          const audioTrack = localStreamRef.current.getAudioTracks()[0];
          if (audioTrack) {
            audioTrack.enabled = true;
          }
        }
        setIsMuted(false);
      } else {
        // Turn microphone off
        if (localStreamRef.current) {
          const audioTrack = localStreamRef.current.getAudioTracks()[0];
          if (audioTrack) {
            audioTrack.enabled = false;
          }
        }
        setIsMuted(true);
      }
      
      // Send status update
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: "status_update",
          muted: !isMuted
        }));
      }
    } catch (error) {
      console.error("Microphone toggle error:", error);
      setMediaError("Failed to access microphone. Please check permissions.");
    }
  }, [isMuted, isCameraOff]);

  const toggleCamera = useCallback(async () => {
    try {
      if (isCameraOff) {
        // Turn camera on
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: !isMuted 
        });
        
        if (localStreamRef.current) {
          // Stop existing tracks
          localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsCameraOff(false);
      } else {
        // Turn camera off
        if (localStreamRef.current) {
          const videoTracks = localStreamRef.current.getVideoTracks();
          videoTracks.forEach(track => {
            track.stop();
            localStreamRef.current.removeTrack(track);
          });
        }
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
        setIsCameraOff(true);
      }
      
      // Send status update
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: "status_update",
          camera_off: isCameraOff
        }));
      }
      
      setMediaError(null);
    } catch (error) {
      console.error("Camera toggle error:", error);
      setMediaError("Failed to access camera. Please check permissions and ensure your camera isn't being used by another application.");
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

  // Handle leaving session with backend cleanup
  const handleLeaveSession = useCallback(async () => {
    try {
      // Clean up local resources first
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Close all peer connections
      peerConnectionsRef.current.forEach(peerConnection => {
        peerConnection.close();
      });
      peerConnectionsRef.current.clear();
      remoteVideosRef.current.clear();

      // Close WebSocket connection
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }

      // Notify backend about leaving the session
      if (sessionInfo?.group?.id) {
        const result = await leaveSession(sessionInfo.group.id);
        if (result?.group_deleted) {
          setEndNotificationMessage("Study group has been automatically deleted since no participants remain.");
          setEndNotificationType("success");
          setShowEndNotification(true);
          return; // Don't call onLeaveSession immediately, wait for user acknowledgment
        } else if (result?.success) {
          setEndNotificationMessage("You have left the study session.");
          setEndNotificationType("success");
          setShowEndNotification(true);
          return;
        }
      }

      // If no backend result or error, just leave
      onLeaveSession();
    } catch (error) {
      console.error("Error leaving session:", error);
      setEndNotificationMessage("There was an error leaving the session, but you have been disconnected.");
      setEndNotificationType("error");
      setShowEndNotification(true);
    }
  }, [sessionInfo, leaveSession, onLeaveSession]);

  const handleEndNotificationClose = () => {
    setShowEndNotification(false);
    onLeaveSession();
  };

  // Clean up media streams and peer connections on unmount
  useEffect(() => {
    return () => {
      // Stop local media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Close all peer connections
      peerConnectionsRef.current.forEach(peerConnection => {
        peerConnection.close();
      });
      peerConnectionsRef.current.clear();
      remoteVideosRef.current.clear();
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
            onClick={handleLeaveSession}
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
          
          {mediaError && (
            <div className="text-red-400 text-sm max-w-xs">
              {mediaError}
            </div>
          )}
          
          <button
            onClick={handleLeaveSession}
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
            <h3 className="text-white mb-2 font-semibold">You</h3>
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
                <div className="w-full h-full flex items-center justify-center text-white bg-gray-700">
                  <div className="text-center">
                    <VideoOff className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">Camera Off</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                You {isMuted && <span className="text-red-400">(Muted)</span>}
                {!isCameraOff && <span className="text-green-400 ml-1">(Camera On)</span>}
              </div>
            </div>
          </div>

          {/* Other Participants */}
          {participants.length > 1 && (
            <div className="mb-4">
              <h3 className="text-white mb-2 font-semibold">Other Participants ({participants.length - 1})</h3>
            </div>
          )}

          {/* Participants grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {participants.filter(p => p.user_id !== userId).map((participant) => (
              <div key={participant.id} className="relative bg-gray-800 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                {!participant.camera_off ? (
                  <video
                    ref={(el) => {
                      if (el) {
                        remoteVideosRef.current.set(participant.id, el);
                      }
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white bg-gray-700">
                    <div className="text-center">
                      <VideoOff className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-xs">{participant.name}</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  {participant.name}
                  {participant.muted && <span className="text-red-400 ml-1">(Muted)</span>}
                  {!participant.camera_off && <span className="text-green-400 ml-1">(Camera On)</span>}
                  {participant.is_screen_sharing && <span className="text-blue-400 ml-1">(Sharing)</span>}
                  {participant.hand_raised && <span className="text-yellow-400 ml-1">✋</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Show message if user is alone */}
          {participants.length === 1 && (
            <div className="text-center text-gray-400 mt-8">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>You're the only one in this session right now.</p>
              <p className="text-sm mt-2">Share the session link to invite others!</p>
            </div>
          )}
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

      {/* Session End Notification */}
      <SessionEndNotification
        isVisible={showEndNotification}
        message={endNotificationMessage}
        type={endNotificationType}
        onClose={handleEndNotificationClose}
      />
    </div>
  );
};

export default StudySessionRoom;
