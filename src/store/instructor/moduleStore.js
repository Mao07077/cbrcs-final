import { create } from "zustand";


const useModuleStore = create((set, get) => ({
    modules: [
    {
      _id: "mod1",
      title: "Introduction to Professional Education",
      description: "An overview of the teaching profession, its history, and philosophical foundations.",
      file: "/path/to/profed_intro.pdf",
      subject: "profed",
    },
    {
      _id: "mod2",
      title: "Child and Adolescent Development",
      description: "A study of the developmental stages of learners and the corresponding educational implications.",
      file: "/path/to/child_dev.pdf",
      subject: "profed",
    },
    {
      _id: "mod3",
      title: "Rizal's Life and Works",
      description: "A comprehensive study of the life of the Philippine national hero.",
      file: "/path/to/rizal.pdf",
      subject: "gened",
    },
  ],
  isLoading: false,
  error: null,
  isModalOpen: false,
  editingModule: null,

  // --- Actions ---
  fetchModules: () => {
    // Mock implementation
    const { modules } = get();
    set({ modules, isLoading: false });
  },

  saveModule: (formData) => {
    set({ isLoading: true });
    const { editingModule, modules } = get();
    const newModuleData = {
      _id: editingModule ? editingModule._id : `mod${Date.now()}`,
      title: formData.get('title'),
      description: formData.get('description'),
      subject: formData.get('subject'),
      file: formData.get('file') ? URL.createObjectURL(formData.get('file')) : (editingModule ? editingModule.file : null),
    };

    let updatedModules;
    if (editingModule) {
      updatedModules = modules.map(m => m._id === editingModule._id ? newModuleData : m);
    } else {
      updatedModules = [...modules, newModuleData];
    }

    set({ modules: updatedModules, isLoading: false, isModalOpen: false, editingModule: null });
  },

  deleteModule: (moduleId) => {
    if (!window.confirm("Are you sure you want to delete this module?")) return;

    set(state => ({
      modules: state.modules.filter(m => m._id !== moduleId),
    }));
  },

  // --- Modal Control ---
  openModal: (module = null) =>
    set({ isModalOpen: true, editingModule: module, error: null }),
  closeModal: () => set({ isModalOpen: false, editingModule: null }),
}));

export default useModuleStore;
