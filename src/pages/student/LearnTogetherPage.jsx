import React, { useEffect } from "react";
import useLearnTogetherStore from "../../store/student/learnTogetherStore";
import StudyGroupCard from "../../features/student/learnTogether/components/StudyGroupCard";
import CreateGroupModal from "../../features/student/learnTogether/components/CreateGroupModal";

const LearnTogetherPage = () => {
  const { groups, openModal, fetchGroups, isLoading, error } = useLearnTogetherStore();

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading study groups...</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Find a Study Group
        </h1>
        <button
          onClick={openModal}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-colors"
        >
          Create Group
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <StudyGroupCard key={group.id} group={group} />
        ))}
      </div>
      
      <CreateGroupModal />
    </div>
  );
};

export default LearnTogetherPage;
