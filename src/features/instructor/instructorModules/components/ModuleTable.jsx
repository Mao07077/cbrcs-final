import { FiEdit, FiTrash2 } from "react-icons/fi";
import useModuleStore from "../../../../store/instructor/moduleStore";

const ModuleTable = ({ modules }) => {
  const { openModal, deleteModule } = useModuleStore();

  return (
    <div className="card overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Module Title</th>
            <th>Program</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {modules.map((module) => (
            <tr key={module._id}>
              <td>{module.title}</td>
              <td>{module.program}</td>
              <td>
                <button
                  onClick={() => openModal(module)}
                  className="btn-ghost"
                >
                  <FiEdit />
                </button>
                <button
                  onClick={() => deleteModule(module._id)}
                  className="btn-ghost-danger"
                >
                  <FiTrash2 />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ModuleTable;
