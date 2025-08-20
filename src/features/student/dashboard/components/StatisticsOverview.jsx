import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  BookOpen,
  Clock,
  Award,
  Target,
  Activity,
} from "lucide-react";
import useDashboardStore from "../../../../store/student/dashboardStore";

const StatisticsOverview = () => {
  const { modules, preTests, postTests } = useDashboardStore();

  // Mock enhanced statistics data (in real app, this would come from backend)
  const mockStats = {
    totalStudyHours: 156,
    completedModules: modules?.length || 12,
    totalModules: 15,
    averageScore: 88.5,
    weeklyProgress: [
      { day: "Mon", hours: 3.5, score: 85 },
      { day: "Tue", hours: 4.2, score: 88 },
      { day: "Wed", hours: 2.8, score: 82 },
      { day: "Thu", hours: 5.1, score: 92 },
      { day: "Fri", hours: 3.9, score: 89 },
      { day: "Sat", hours: 4.5, score: 91 },
      { day: "Sun", hours: 3.2, score: 87 },
    ],
    subjectPerformance: [
      { subject: "Math", score: 92, color: "#3B82F6" },
      { subject: "Science", score: 85, color: "#10B981" },
      { subject: "English", score: 89, color: "#8B5CF6" },
      { subject: "History", score: 87, color: "#F59E0B" },
    ],
    learningStreak: 12,
    totalQuestions: (preTests?.length || 0) + (postTests?.length || 0),
    correctAnswers: 248,
    accuracy: 85.2,
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => (
    <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </div>
      {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Statistics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          title="Modules Completed"
          value={`${mockStats.completedModules}/${mockStats.totalModules}`}
          subtitle={`${Math.round(
            (mockStats.completedModules / mockStats.totalModules) * 100
          )}% completed`}
          color="blue"
        />
        <StatCard
          icon={Clock}
          title="Study Hours"
          value={`${mockStats.totalStudyHours}h`}
          subtitle="This month"
          color="green"
        />
        <StatCard
          icon={Award}
          title="Average Score"
          value={`${mockStats.averageScore}%`}
          subtitle="All assessments"
          color="purple"
        />
        <StatCard
          icon={Activity}
          title="Learning Streak"
          value={`${mockStats.learningStreak} days`}
          subtitle="Keep it up!"
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            Weekly Progress
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={mockStats.weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                name="Study Hours"
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                name="Average Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Performance Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-purple-600" />
            Subject Performance
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={mockStats.subjectPerformance}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="score"
                label={({ subject, score }) => `${subject}: ${score}%`}
              >
                {mockStats.subjectPerformance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Performance Metrics */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Detailed Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {mockStats.totalQuestions}
            </p>
            <p className="text-sm text-gray-600">Total Questions Answered</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {mockStats.correctAnswers}
            </p>
            <p className="text-sm text-gray-600">Correct Answers</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {mockStats.accuracy}%
            </p>
            <p className="text-sm text-gray-600">Overall Accuracy</p>
          </div>
        </div>
      </div>

      {/* Subject Performance Bar Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Subject Performance Breakdown
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={mockStats.subjectPerformance}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="subject" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
              {mockStats.subjectPerformance.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatisticsOverview;
