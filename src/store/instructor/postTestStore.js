import { create } from "zustand";

const usePostTestStore = create((set, get) => ({
  modules: [
    { _id: "mod1", title: "Professional Education" },
    { _id: "mod2", title: "General Education" },
    { _id: "mod3", title: "Specialization" },
    { _id: "mod4", title: "Advanced Topics" },
    { _id: "mod5", title: "Review and Assessment" },
    { _id: "mod6", title: "Final Coaching" },
  ],
  tests: {
    mod1: [
      {
        _id: "test1",
        module_id: "mod1",
        title: "Intro to Prof Ed: Key Concepts",
        questions: [
          {
            question: "Who is considered the father of modern education?",
            options: ["John Dewey", "Jean Piaget", "Lev Vygotsky", "B.F. Skinner"],
            correctAnswer: "John Dewey",
          },
          {
            question: "What is the primary focus of behaviorism?",
            options: [
              "Internal mental states",
              "Observable behaviors",
              "Unconscious desires",
              "Social interactions",
            ],
            correctAnswer: "Observable behaviors",
          },
        ],
      },
      {
        _id: "test2",
        module_id: "mod1",
        title: "Assessment and Evaluation Principles",
        questions: [
          {
            question: "What is formative assessment?",
            options: [
              "An assessment of learning",
              "An assessment for learning",
              "A final exam",
              "A standardized test",
            ],
            correctAnswer: "An assessment for learning",
          },
        ],
      },
    ],
    mod2: [
      {
        _id: "test3",
        module_id: "mod2",
        title: "Child and Adolescent Development",
        questions: [
          {
            question: "Which stage in Piaget's theory is characterized by abstract thought?",
            options: [
              "Sensorimotor",
              "Preoperational",
              "Concrete operational",
              "Formal operational",
            ],
            correctAnswer: "Formal operational",
          },
        ],
      },
    ],
    mod3: [],
    mod4: [],
    mod5: [],
    mod6: [],
  },
  editingTest: null,
  isModalOpen: false,
  isLoading: false,
  error: null,

  fetchTestsForModule: async (moduleId) => {
    set({ isLoading: true });
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      set({ isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  openModal: (test) => {
    set({ editingTest: test, isModalOpen: true });
  },

  newTest: (moduleId) => {
    if (!moduleId) {
      console.error("A module must be selected to create a new test.");
      return;
    }
    set({
      editingTest: {
        _id: `new_${Date.now()}`,
        module_id: moduleId,
        title: "",
        questions: [{ question: "", options: ["", "", "", ""], correctAnswer: "" }],
      },
      isModalOpen: true,
    });
  },

  closeModal: () => {
    set({ isModalOpen: false, editingTest: null });
  },

  saveTest: (testData) => {
    set((state) => {
      const { module_id } = testData;
      const moduleTests = state.tests[module_id] ? [...state.tests[module_id]] : [];
      const existingTestIndex = moduleTests.findIndex((t) => t._id === testData._id);

      if (existingTestIndex > -1) {
        // Update existing test
        moduleTests[existingTestIndex] = testData;
      } else {
        // Add new test
        moduleTests.push(testData);
      }

      return {
        tests: {
          ...state.tests,
          [module_id]: moduleTests,
        },
      };
    });
  },

  deleteTest: (testId, moduleId) => {
    set((state) => {
      const updatedModuleTests = state.tests[moduleId].filter((t) => t._id !== testId);
      return {
        tests: {
          ...state.tests,
          [moduleId]: updatedModuleTests,
        },
      };
    });
  },
}));

export default usePostTestStore;
