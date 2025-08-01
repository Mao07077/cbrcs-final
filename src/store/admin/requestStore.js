import { create } from "zustand";


const useRequestStore = create((set, get) => ({
    requests: [
    {
      _id: "req1",
      id_number: "2023-0005",
      firstname: "Mike",
      lastname: "Ross",
      email: "mike.ross@example.com",
      contact_number: "555-123-4567",
      role: "student",
      request_type: "update",
      current_data: { contact_number: "123-456-7890" },
      update_data: { contact_number: "555-123-4567" },
      createdAt: new Date("2023-11-20T11:30:00Z"),
    },
    {
      _id: "req2",
      id_number: "2023-0006",
      firstname: "Harvey",
      lastname: "Specter",
      email: "harvey.specter@example.com",
      contact_number: "555-987-6543",
      role: "instructor",
      request_type: "update",
      current_data: { email: "harvey.s@example.com" },
      update_data: { email: "harvey.specter@example.com" },
      createdAt: new Date("2023-11-18T09:00:00Z"),
    },
  ],
  selectedRequest: null,
  isLoading: false,
  error: null,

  // --- Actions ---
  fetchRequests: () => {
    // Mock implementation, data is pre-loaded
    set({ isLoading: false });
  },

  acceptRequest: (requestId) => {
    set({ isLoading: true });
    setTimeout(() => {
      set((state) => ({
        requests: state.requests.filter((r) => r._id !== requestId),
        isLoading: false,
        selectedRequest: null,
      }));
    }, 500);
  },

  declineRequest: (requestId) => {
    if (!window.confirm("Are you sure you want to decline this request?"))
      return;

    set({ isLoading: true });
    setTimeout(() => {
      set((state) => ({
        requests: state.requests.filter((r) => r._id !== requestId),
        isLoading: false,
        selectedRequest: null,
      }));
    }, 500);
  },

  // --- Modal Control ---
  viewRequest: (request) => set({ selectedRequest: request }),
  closeModal: () => set({ selectedRequest: null }),
}));

export default useRequestStore;
