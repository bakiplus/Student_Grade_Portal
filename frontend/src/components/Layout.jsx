/**
 * Layout component with Amharic sidebar navigation.
 */

import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StudentAvatar from './StudentAvatar';

export default function Layout() {
  const { user, logout, isInstructor } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    const wasInstructor = isInstructor;
    await logout();
    navigate(wasInstructor ? '/instructor/login' : '/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  const getRoleLabel = () => {
    if (user?.role === 'admin' || user?.is_superuser) return 'ዋና አስተዳዳሪ (Admin)';
    if (user?.role === 'instructor' || user?.is_staff) return 'አስተማሪ (Instructor)';
    return 'ተማሪ (Student)';
  };

  return (
    <div className="app-layout">
      {/* Mobile menu toggle */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="ምናሌ ክፈት"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">የውጤት ፖርታል</div>
          <div className="sidebar-subtitle">Student Grade Portal</div>
        </div>

        <nav className="sidebar-nav">
          {isInstructor ? (
            <>
              <NavLink
                to="/instructor/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="nav-icon">📊</span>
                ዳሽቦርድ (Dashboard)
              </NavLink>
              <NavLink
                to="/instructor/courses/create"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="nav-icon">➕</span>
                አዲስ ኮርስ ፍጠር
              </NavLink>
              <NavLink
                to="/instructor/students"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="nav-icon">👥</span>
                ተማሪዎችን አስተዳድር
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/student/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="nav-icon">📚</span>
                የእኔ ኮርሶች እና ውጤቶች
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <StudentAvatar student={user} size="md" />
            <div className="user-details">
              <div className="user-name">
                {user?.first_name || user?.last_name
                  ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
                  : user?.username}
              </div>
              <div className="user-role">
                {getRoleLabel()}
                {user?.student_id && ` · ${user.student_id}`}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost w-full mt-2" onClick={handleLogout}>
            🚪 ውጣ (Logout)
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 99 }}
          onClick={closeSidebar}
        />
      )}

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
