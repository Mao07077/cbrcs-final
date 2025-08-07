import React from "react";
import { useNavigate } from "react-router-dom";
import useLearnTogetherStore from "../../../../store/student/learnTogetherStore";

const StudyGroupCard = ({ group }) => {
  const navigate = useNavigate();
  const { joinGroup, startSession, joinSession } = useLearnTogetherStore();

  const handleJoinGroup = async () => {
    try {
      await joinGroup(group.id);
      // Navigate to the study session
      navigate(`/student/study-session/${group.id}`);
    } catch (error) {
      console.error("Failed to join group:", error);
    }
  };

  const handleStartSession = async () => {
    try {
      const success = await startSession(group.id);
      if (success) {
        // Navigate to the study session
        navigate(`/student/study-session/${group.id}`);
      }
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  const handleJoinSession = async () => {
    try {
      if (group.is_session_active) {
        await joinSession(group.id);
      }
      // Navigate to the study session regardless
      navigate(`/student/study-session/${group.id}`);
    } catch (error) {
      console.error("Failed to join session:", error);
    }
  };

  const isSessionActive = group.is_session_active;
  const participantCount = group.active_participants?.length || 1; // Default to 1 since creator is always there

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border-l-4 border-green-500">
      {/* Live Session Indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-semibold text-green-600">
          LIVE NOW • {participantCount} participant{participantCount !== 1 ? 's' : ''}
        </span>
      </div>
      
      <h3 className="text-xl font-bold text-primary-dark mb-2">
        {group.title}
      </h3>
      <p className="text-sm font-semibold text-gray-500 mb-4">
        {group.subject}
      </p>
      
      {group.schedule && (
        <div className="mb-4">
          <p className="font-bold">Topic:</p>
          <p className="text-sm text-gray-600">{group.schedule}</p>
        </div>
      )}
      
      <div className="mb-4">
        <p className="font-bold">Currently in session:</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {group.active_participants?.slice(0, 3).map((participant, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
            >
              {participant}
            </span>
          ))}
          {group.active_participants?.length > 3 && (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              +{group.active_participants.length - 3} more
            </span>
          )}
        </div>
      </div>
      
      <button 
        onClick={handleJoinSession}
        className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
      >
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        Join Live Session
      </button>
    </div>
  );
};

export default StudyGroupCard;
