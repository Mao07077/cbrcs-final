import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import useDashboardStore from "../../../../store/student/dashboardStore";

const ScoreOverview = () => {
  const { preTests, postTests } = useDashboardStore();

  // Calculate statistics
  const totalTests = (preTests?.length || 0) + (postTests?.length || 0);
  const preTestScores =
    preTests?.map((test) => ({
      name: test.pre_test_title?.substring(0, 20) + "..." || "Pre-test",
      score: Math.round((test.correct / test.total_questions) * 100),
      type: "Pre-test",
    })) || [];

  const postTestScores =
    postTests?.map((test) => ({
      name: test.post_test_title?.substring(0, 20) + "..." || "Post-test",
      score: Math.round((test.correct / test.total_questions) * 100),
      type: "Post-test",
    })) || [];

  const allScores = [...preTestScores, ...postTestScores];
  const averageScore =
    allScores.length > 0
      ? Math.round(
          allScores.reduce((sum, test) => sum + test.score, 0) /
            allScores.length
        )
      : 0;

  const improvementRate =
    preTestScores.length > 0 && postTestScores.length > 0
      ? Math.round(
          postTestScores.reduce((sum, test) => sum + test.score, 0) /
            postTestScores.length -
            preTestScores.reduce((sum, test) => sum + test.score, 0) /
              preTestScores.length
        )
      : 0;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold text-primary-dark mb-6 flex items-center">
        <TrendingUp className="w-6 h-6 mr-2 text-blue-600" />
        Test Performance
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{totalTests}</p>
          <p className="text-sm text-gray-600">Total Tests</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{averageScore}%</p>
          <p className="text-sm text-gray-600">Average Score</p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <p
            className={`text-2xl font-bold ${
              improvementRate >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {improvementRate > 0 ? "+" : ""}
            {improvementRate}%
          </p>
          <p className="text-sm text-gray-600">Improvement</p>
        </div>
      </div>

      {/* Score Chart */}
      {allScores.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Score Trends
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={allScores.slice(-6)}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                stroke="#666"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="score" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Test List */}
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-lg text-gray-700 mb-3 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
            Pre-Tests ({preTests?.length || 0})
          </h3>
          {preTests && preTests.length > 0 ? (
            <div className="space-y-2">
              {preTests.map((test, i) => {
                const score = Math.round(
                  (test.correct / test.total_questions) * 100
                );
                return (
                  <div
                    key={i}
                    className="flex justify-between items-center p-3 bg-orange-50 rounded-lg"
                  >
                    <span className="text-gray-700 font-medium">
                      {test.pre_test_title || `Pre-test ${i + 1}`}
                    </span>
                    <div className="text-right">
                      <span
                        className={`text-lg font-bold ${
                          score >= 75 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {score}%
                      </span>
                      <p className="text-sm text-gray-500">
                        {test.correct}/{test.total_questions}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 bg-gray-50 p-4 rounded-lg">
              No pre-tests taken yet.
            </p>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-lg text-gray-700 mb-3 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
            Post-Tests ({postTests?.length || 0})
          </h3>
          {postTests && postTests.length > 0 ? (
            <div className="space-y-2">
              {postTests.map((test, i) => {
                const score = Math.round(
                  (test.correct / test.total_questions) * 100
                );
                return (
                  <div
                    key={i}
                    className="flex justify-between items-center p-3 bg-green-50 rounded-lg"
                  >
                    <span className="text-gray-700 font-medium">
                      {test.post_test_title || `Post-test ${i + 1}`}
                    </span>
                    <div className="text-right">
                      <span
                        className={`text-lg font-bold ${
                          score >= 75 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {score}%
                      </span>
                      <p className="text-sm text-gray-500">
                        {test.correct}/{test.total_questions}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 bg-gray-50 p-4 rounded-lg">
              No post-tests taken yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoreOverview;
