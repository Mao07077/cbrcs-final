import { create } from "zustand";


const useAdminDashboardStore = create((set) => ({
  stats: {
    totalStudents: 2,
    totalInstructors: 1,
  },
  students: [
    {
      _id: "3",
      firstname: "Peter",
      lastname: "Jones",
      id_number: "2023-0003",
      role: "student",
      email: "peter.jones@example.com",
      password: "password123",
      contact_number: "123-456-7890",
      is_verified: true,
    },
    {
      _id: "4",
      firstname: "Mary",
      lastname: "Jane",
      id_number: "2023-0004",
      role: "student",
      email: "mary.jane@example.com",
      password: "password123",
      contact_number: "123-456-7890",
      is_verified: false,
    },
  ],
  instructors: [
    {
      _id: "2",
      firstname: "Jane",
      lastname: "Smith",
      id_number: "2023-0002",
      role: "instructor",
      email: "jane.smith@example.com",
      password: "password123",
      contact_number: "123-456-7890",
      is_verified: true,
    },
  ],
  isLoading: false,
  error: null,

  // --- Action ---
  fetchDashboardData: () => {
    // Mock implementation, data is pre-loaded
    set({ isLoading: false });
  },
}));

export default useAdminDashboardStore;
