import { create } from "zustand";
import axios from "../../api/axios";

const useInstructorDashboardStore = create((set) => ({
  stats: { totalStudents: 0, engagementRate: 0 },
  modules: [],
  attendanceData: [],
  isLoading: false,
  error: null,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('/api/instructor/dashboard');
      if (response.data.success) {
        set({
          isLoading: false,
          stats: response.data.stats || { totalStudents: 0, engagementRate: 0 },
          modules: response.data.modules || [],
          attendanceData: response.data.attendanceData || [],
        });
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching instructor dashboard data:', error);
      set({
        isLoading: false,
        error: 'Failed to fetch dashboard data',
        stats: { totalStudents: 0, engagementRate: 0 },
        modules: [],
        attendanceData: [],
      });
    }
  },
}));

export default useInstructorDashboardStore;
