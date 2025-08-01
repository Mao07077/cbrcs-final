import { create } from "zustand";
import scheduleService from "../../services/scheduleService";
import useAuthStore from "../authStore";

const getInitialEvents = () => {
  const now = new Date();
  return [
    {
      id: 1,
      title: "Review General Education Concepts",
      start: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        10,
        0,
        0
      ),
      end: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        11,
        30,
        0
      ),
      resourceId: "gen-ed",
    },
    {
      id: 2,
      title: "Practice Majorship Exam",
      start: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        14,
        0,
        0
      ),
      end: new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        16,
        0,
        0
      ),
      resourceId: "majorship",
    },
  ];
};

const useSchedulerStore = create((set, get) => ({
  events: [],
  isModalOpen: false,
  selectedEvent: null,
  isLoading: false,
  error: null,

  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const { userData } = useAuthStore.getState();
      if (!userData?.id_number) {
        throw new Error("User not authenticated");
      }

      const events = await scheduleService.getSchedules(userData.id_number);
      // Convert backend dates to JavaScript Date objects
      const formattedEvents = events.map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end)
      }));
      
      set({ events: formattedEvents, isLoading: false });
    } catch (error) {
      console.error("Schedule fetch error:", error);
      // Fallback to initial events if API fails
      set({ 
        events: getInitialEvents(), 
        isLoading: false, 
        error: "Failed to load schedule, using cached data" 
      });
    }
  },

  openModal: (event) =>
    set({ isModalOpen: true, selectedEvent: event || null }),
  closeModal: () => set({ isModalOpen: false, selectedEvent: null }),

  addEvent: async (event) => {
    set({ isLoading: true, error: null });
    try {
      const { userData } = useAuthStore.getState();
      if (!userData?.id_number) {
        throw new Error("User not authenticated");
      }

      const eventPayload = {
        ...event,
        user_id: userData.id_number
      };

      const savedEvent = await scheduleService.createSchedule(eventPayload);
      set((state) => ({
        events: [...state.events, {
          ...savedEvent,
          start: new Date(savedEvent.start),
          end: new Date(savedEvent.end)
        }],
        isLoading: false
      }));
    } catch (error) {
      console.error("Add event error:", error);
      set({ 
        isLoading: false, 
        error: "Failed to add event" 
      });
    }
  },

  updateEvent: async (updatedEvent) => {
    set({ isLoading: true, error: null });
    try {
      const savedEvent = await scheduleService.updateSchedule(updatedEvent.id, updatedEvent);
      set((state) => ({
        events: state.events.map((event) =>
          event.id === updatedEvent.id ? {
            ...savedEvent,
            start: new Date(savedEvent.start),
            end: new Date(savedEvent.end)
          } : event
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error("Update event error:", error);
      set({ 
        isLoading: false, 
        error: "Failed to update event" 
      });
    }
  },

  deleteEvent: async (eventId) => {
    set({ isLoading: true, error: null });
    try {
      await scheduleService.deleteSchedule(eventId);
      set((state) => ({
        events: state.events.filter((event) => event.id !== eventId),
        isLoading: false
      }));
    } catch (error) {
      console.error("Delete event error:", error);
      set({ 
        isLoading: false, 
        error: "Failed to delete event" 
      });
    }
  },
}));

export default useSchedulerStore;
