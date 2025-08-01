import React from "react";
import useDashboardStore from "../../../../store/student/dashboardStore";

const ScoreOverview = () => {
  const { preTests, postTests } = useDashboardStore();

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold text-primary-dark mb-4">Test Scores</h2>
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-lg text-gray-700 mb-2">
            Pre-Tests
          </h3>
          {preTests.length > 0 ? (
            <ul className="space-y-2">
              {preTests.map((test, i) => (
                <li key={i}>
                  {test.pre_test_title}: {test.correct}/{test.total_questions}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No pre-tests taken yet.</p>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-lg text-gray-700 mb-2">
            Post-Tests
          </h3>
          {postTests.length > 0 ? (
            <ul className="space-y-2">
              {postTests.map((test, i) => (
                <li key={i}>
                  {test.post_test_title}: {test.correct}/{test.total_questions}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No post-tests taken yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScoreOverview;
