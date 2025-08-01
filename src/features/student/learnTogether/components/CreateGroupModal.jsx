import React, { useState } from "react";
import useLearnTogetherStore from "../../../../store/student/learnTogetherStore";

const CreateGroupModal = () => {
  const { isModalOpen, closeModal, addGroup } = useLearnTogetherStore();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [schedule, setSchedule] = useState("");

  if (!isModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    addGroup({ title, subject, schedule });
    closeModal();
    setTitle("");
    setSubject("");
    setSchedule("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6">Create a New Study Group</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Group Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Schedule
            </label>
            <input
              type="text"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g., Mon, Wed @ 6 PM"
              required
            />
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
