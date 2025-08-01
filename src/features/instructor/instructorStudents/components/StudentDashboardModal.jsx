import useStudentStore from "../../../../store/instructor/studentStore";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="card max-w-lg w-full">
        {children}
      </div>
    </div>
  );
};

const StudentDashboardModal = () => {
  const { isModalOpen, selectedStudent, closeStudentModal } = useStudentStore();

  // In a real app, you'd fetch this data or have it included with the student object.
  const studentStats = {
    modulesCompleted: 8,
    totalModules: 12,
    averageScore: "88%",
    lastLogin: "2024-07-28",
  };

  return (
    <Modal isOpen={isModalOpen} onClose={closeStudentModal}>
      {selectedStudent && (
        <div>
          <h2 className="text-2xl font-bold mb-4">
            {selectedStudent.name}'s Dashboard
          </h2>
          <div className="space-y-3">
            <p>
              <span className="font-semibold">Student No:</span>{" "}
              {selectedStudent.studentNo}
            </p>
            <p>
              <span className="font-semibold">Program:</span>{" "}
              {selectedStudent.program}
            </p>
            <hr className="my-4" />
            <h3 className="text-lg font-semibold">Performance Stats</h3>
            <p>
              Modules Completed: {studentStats.modulesCompleted} /{" "}
              {studentStats.totalModules}
            </p>
            <p>Average Score: {studentStats.averageScore}</p>
            <p>Last Login: {studentStats.lastLogin}</p>
          </div>
          <div className="text-right mt-6">
            <button
              onClick={closeStudentModal}
              className="btn btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default StudentDashboardModal;
