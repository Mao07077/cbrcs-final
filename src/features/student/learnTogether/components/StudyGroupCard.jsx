import React from "react";
import { useNavigate } from "react-router-dom";
import useLearnTogetherStore from "../../../../store/student/learnTogetherStore";

const StudyGroupCard = ({ group }) => {
  const navigate = useNavigate();
  const { joinGroup } = useLearnTogetherStore();

  const handleJoinGroup = async () => {
    try {
      await joinGroup(group.id);
      // Navigate to the study session
      navigate(`/student/study-session/${group.id}`);
    } catch (error) {
      console.error("Failed to join group:", error);
    }
  };

  const handleJoinSession = () => {
    // Navigate directly to study session (for existing members)
    navigate(`/student/study-session/${group.id}`);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
      <h3 className="text-xl font-bold text-primary-dark mb-2">
        {group.title}
      </h3>
      <p className="text-sm font-semibold text-gray-500 mb-4">
        {group.subject}
      </p>
      <div className="mb-4">
        <p className="font-bold">Members ({group.members?.length || 0}):</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {group.members?.slice(0, 3).map((member, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {member}
            </span>
          ))}
          {group.members?.length > 3 && (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              +{group.members.length - 3} more
            </span>
          )}
        </div>
      </div>
      <div className="mb-4">
        <p className="font-bold">Schedule:</p>
        <p className="text-sm text-gray-600">{group.schedule}</p>
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={handleJoinGroup}
          className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Join Group
        </button>
        <button 
          onClick={handleJoinSession}
          className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
        >
          Join Session
        </button>
      </div>
    </div>
  );
};

export default StudyGroupCard;
