import { create } from "zustand";
import apiClient from '../../api/axios';

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

  saveModule: async (formData) => {
    set({ isLoading: true });
    try {
      // Send to backend
      const response = await apiClient.post('/api/create_module', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Fetch all modules from backend after creation
      const modulesResponse = await apiClient.get('/api/modules');
      set({ modules: modulesResponse.data, isLoading: false, isModalOpen: false, editingModule: null });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
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
