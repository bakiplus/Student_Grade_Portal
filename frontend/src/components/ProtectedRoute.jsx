/**
 * ProtectedRoute — guards routes based on authentication and role.
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, loading, isInstructor, isStudent } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <div className="loading-text">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect instructors/admins to /instructor/login, students to /login
    const loginPath = role === 'instructor' ? '/instructor/login' : '/login';
    return <Navigate to={loginPath} replace />;
  }

  if (role === 'instructor' && !isInstructor) {
    return <Navigate to="/student/dashboard" replace />;
  }

  if (role === 'student' && !isStudent) {
    return <Navigate to="/instructor/dashboard" replace />;
  }

  return children;
}

