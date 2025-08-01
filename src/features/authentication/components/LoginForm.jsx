import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../../../store/authStore";

const LoginForm = () => {
  const [idNumber, setIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login({ idNumber, password });
    
    if (result.success) {
      // Redirect based on user role or survey completion status
      const userData = useAuthStore.getState().userData;
      const isNewUser = useAuthStore.getState().isNewUser;
      
      if (isNewUser && userData.role === 'student') {
        navigate('/survey');
      } else {
        // Redirect to appropriate dashboard based on role
        switch (userData.role) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'instructor':
            navigate('/instructor/dashboard');
            break;
          case 'student':
            navigate('/student/dashboard');
            break;
          default:
            navigate('/student/dashboard');
        }
      }
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-center mb-6">
        <img src="/cbrc_logo.png" alt="CBRCS Logo" className="h-16 w-16" />
      </div>
      <h2 className="text-2xl font-bold text-center text-primary-dark mb-6">
        Welcome Back
      </h2>
      {error && (
        <p className="bg-danger-light text-danger-dark p-3 rounded-md mb-4 text-center">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} noValidate>
                <input
          type="number"
          placeholder="ID Number"
          value={idNumber}
          onChange={(e) => setIdNumber(e.target.value)}
          className="form-input mb-4"
          required
        />
                <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input mb-4"
          required
        />
                <button
          type="submit"
          className="btn btn-primary w-full py-3"
          disabled={isLoading}
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </button>
        <div className="flex justify-between items-center mt-6 text-sm">
                    <Link
            to="/forgot-password"
            className="text-primary hover:underline"
          >
            Forgot Password?
          </Link>
                    <Link
            to="/signup"
            className="text-primary-dark font-semibold hover:underline"
          >
            Sign Up
          </Link>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
