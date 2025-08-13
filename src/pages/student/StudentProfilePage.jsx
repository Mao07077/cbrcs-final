import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Camera,
  Calendar,
  BookOpen,
  TrendingUp,
  Edit3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import useAuthStore from "../../store/authStore";
import profileService from "../../services/profileService";

const StudentProfilePage = () => {
  const navigate = useNavigate();
  const { userData } = useAuthStore();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [top3Habits, setTop3Habits] = useState([]);

  // Mock daily activity data - in real implementation this would come from backend
  const [dailyData] = useState([
    { day: "Mon", hours: 2.5 },
    { day: "Tue", hours: 3.2 },
    { day: "Wed", hours: 4.1 },
    { day: "Thu", hours: 1.8 },
    { day: "Fri", hours: 2.9 },
    { day: "Sat", hours: 3.5 },
    { day: "Sun", hours: 4.2 },
  ]);

  const habitDescriptions = {
    "Study with Friends": "Collaborate and learn together with peers",
    "Asking for Help": "Reach out to instructors and get support",
    "Test Yourself Periodically": "Regular self-assessment and practice",
    "Creating a Study Schedule": "Organize your study time effectively",
    "Setting Study Goals": "Define clear learning objectives",
    "Organizing Notes": "Keep your study materials well-structured",
    "Teach What You've Learned": "Share knowledge to reinforce learning",
    "Use of Flashcards": "Active recall and spaced repetition",
    "Using Aromatherapy, Plants, or Music": "Create optimal study environment",
  };

  const habitNavigationMap = {
    "Study with Friends": "/student/learn-together",
    "Asking for Help": "/student/chat",
    "Test Yourself Periodically": "/student/modules",
    "Creating a Study Schedule": "/student/scheduler",
    "Setting Study Goals": "/student/notes",
    "Organizing Notes": "/student/notes",
    "Teach What You've Learned": "/student/learn-together",
    "Use of Flashcards": "/student/flashcards",
    "Using Aromatherapy, Plants, or Music": "/student/music",
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        if (!userData?.id_number) {
          setError("User not authenticated");
          return;
        }

        // Fetch profile data
        const profileData = await profileService.getProfile(userData.id_number);
        setProfile(profileData);

        // Fetch top 3 study habits
        const habitsData = await profileService.getRecommendedPages(
          userData.id_number
        );
        setTop3Habits(habitsData.recommendedPages || []);
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError(err.message || "Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userData]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
      // In real implementation, upload to backend here
    }
  };

  const handleHabitClick = (habit) => {
    const route = habitNavigationMap[habit];
    if (route) {
      navigate(route);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Account Profile
          </h1>
          <div className="h-1 w-16 bg-primary rounded"></div>
        </div>

        {/* Profile Info Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Profile Image */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 bg-gray-200 rounded-full overflow-hidden border-4 border-gray-300">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() =>
                    document.getElementById("profileImageUpload").click()
                  }
                  className="absolute -bottom-2 -right-2 bg-primary hover:bg-primary-dark text-white p-2 rounded-full shadow-lg transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="profileImageUpload"
                />
              </div>
              <button className="mt-3 flex items-center gap-2 text-primary hover:text-primary-dark text-sm font-medium">
                <Edit3 className="h-4 w-4" />
                Edit Photo
              </button>
            </div>

            {/* Profile Details */}
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    {profile?.firstname} {profile?.lastname}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Number
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    {profile?.id_number}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Program
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    {profile?.program}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Study Hours
                  </label>
                  <div className="text-lg font-semibold text-gray-900">
                    {profile?.hoursActivity || 0} hours
                  </div>
                </div>
              </div>

              {/* Academic Period */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Academic Period
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  September 20, 2024 - March 12, 2025
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top 3 Study Habits Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-gray-900">
              Your Top 3 Study Habits
            </h2>
          </div>

          {top3Habits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {top3Habits.slice(0, 3).map((habit, index) => (
                <div
                  key={index}
                  onClick={() => handleHabitClick(habit)}
                  className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all duration-200 border-l-4 border-primary"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="bg-primary-light p-2 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-primary bg-primary-light px-2 py-1 rounded-full">
                      #{index + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                    {habit}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {habitDescriptions[habit] || `Learn more about ${habit}`}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">
                Complete the survey to discover your top study habits
              </p>
            </div>
          )}
        </div>

        {/* Daily Activity Chart */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-gray-900">
              Daily Study Activity
            </h2>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="day"
                  stroke="#6b7280"
                  fontSize={12}
                  fontFamily="Inter, system-ui, sans-serif"
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  fontFamily="Inter, system-ui, sans-serif"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#f9fafb",
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                  labelStyle={{ color: "#f9fafb" }}
                />
                <Bar
                  dataKey="hours"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  name="Study Hours"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.round(
                  (dailyData.reduce((acc, day) => acc + day.hours, 0) /
                    dailyData.length) *
                    10
                ) / 10}
              </div>
              <div className="text-sm text-gray-600">Avg Hours/Day</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.max(...dailyData.map((day) => day.hours))}
              </div>
              <div className="text-sm text-gray-600">Peak Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {dailyData.reduce((acc, day) => acc + day.hours, 0)}
              </div>
              <div className="text-sm text-gray-600">Total This Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {dailyData.filter((day) => day.hours > 0).length}
              </div>
              <div className="text-sm text-gray-600">Active Days</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
