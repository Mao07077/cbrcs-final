import { create } from "zustand";
import dashboardService from '../../services/dashboardService';
import useAuthStore from '../authStore';

const useDashboardStore = create((set) => ({
  recommendedPages: [],
  modules: [],
  preTests: [],
  postTests: [],
  isLoading: false,
  error: null,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      const { userData } = useAuthStore.getState();
      if (!userData?.id_number) {
        throw new Error("User not authenticated");
      }

      const data = await dashboardService.getDashboardData(userData.id_number);
      
      set({
        recommendedPages: data.recommendedPages || [],
        modules: data.modules || [],
        preTests: data.preTests || [],
        postTests: data.postTests || [],
        isLoading: false
      });
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      set({
        recommendedPages: [],
        modules: [],
        preTests: [],
        postTests: [],
        isLoading: false,
        error: "Failed to load dashboard data. Please try again later."
      });
    }
  },
}));

export default useDashboardStore;
