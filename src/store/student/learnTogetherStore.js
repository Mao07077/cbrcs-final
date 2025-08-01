import { create } from "zustand";
import apiClient from "../../api/axios";
import useAuthStore from "../authStore";

const useLearnTogetherStore = create((set, get) => ({
  groups: [],
  isModalOpen: false,
  isLoading: false,
  error: null,

  fetchGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      // Fetch all available study groups
      const response = await apiClient.get('/api/study-groups');
      if (response.data.success) {
        set({ groups: response.data.groups, isLoading: false });
      } else {
        throw new Error("Failed to fetch study groups");
      }
    } catch (error) {
      console.error("Study groups fetch error:", error);
      set({ 
        groups: [],
        isLoading: false, 
        error: "Failed to load study groups. Please try again later." 
      });
    }
  },

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),

  addGroup: async (newGroup) => {
    set({ isLoading: true, error: null });
    try {
      const { userData } = useAuthStore.getState();
      if (!userData?.id_number) {
        throw new Error("User not authenticated");
      }

      const groupPayload = {
        ...newGroup,
        creator_id: userData.id_number,
        members: [userData.id_number]
      };

      const response = await apiClient.post("/api/study-groups", groupPayload);
      const createdGroup = response.data.group;

      set((state) => ({
        groups: [createdGroup, ...state.groups],
        isModalOpen: false,
        isLoading: false
      }));
    } catch (error) {
      console.error("Create study group error:", error);
      // Fallback to local add
      set((state) => ({
        groups: [
          { ...newGroup, id: `group${Date.now()}`, members: ["You"] },
          ...state.groups,
        ],
        isModalOpen: false,
        isLoading: false,
        error: "Failed to create study group"
      }));
    }
  },

  joinGroup: async (groupId) => {
    try {
      const { userData } = useAuthStore.getState();
      if (!userData?.id_number) return;

      await apiClient.post(`/api/study-groups/${groupId}/join`, {
        user_id: userData.id_number
      });

      // Refresh groups
      get().fetchGroups();
    } catch (error) {
      console.error("Join group error:", error);
      set({ error: "Failed to join group" });
    }
  },
}));

export default useLearnTogetherStore;
