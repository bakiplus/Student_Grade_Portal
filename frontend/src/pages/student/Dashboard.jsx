/**
 * Student Dashboard — የተማሪ ዳሽቦርድ (Amharic Student Dashboard).
 * Shows enrolled courses with rank standing and clean blank avatar placeholder if no photo.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import StudentAvatar from '../../components/StudentAvatar';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/student/courses/');
      setCourses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return { icon: '🥇', label: '1ኛ ደረጃ', color: '#fbbf24' };
    if (rank === 2) return { icon: '🥈', label: '2ኛ ደረጃ', color: '#94a3b8' };
    if (rank === 3) return { icon: '🥉', label: '3ኛ ደረጃ', color: '#d97706' };
    return { icon: '🏆', label: `${rank}ኛ ደረጃ`, color: '#38bdf8' };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <div className="loading-text">የኮርስ መረጃዎችን በመጫን ላይ...</div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Welcome Banner with Student Photo or Blank Placeholder */}
      <div className="student-welcome-banner slide-up">
        <div className="student-welcome-left" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <StudentAvatar student={user} size="lg" />
          <div>
            <h1 className="page-title" style={{ marginBottom: 'var(--space-1)' }}>
              እንኳን ደህና መጡ፣ {user?.first_name}!
            </h1>
            <p className="page-subtitle" style={{ marginBottom: 0 }}>
              የተማሪ መታወቂያ፡ <span className="badge badge-info" style={{ fontWeight: 600 }}>{user?.student_id}</span> · የክፍል ደረጃዎን እና ዝርዝር ውጤትዎን ለማየት ኮርሱን ይምረጡ
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">የተመዘገቡ ኮርሶች</div>
          <div className="stat-value">6</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">የታተሙ ውጤቶች</div>
          <div className="stat-value">6</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">ያለፉባቸው ኮርሶች</div>
          <div
            className="stat-value"
            style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', WebkitBackgroundClip: 'text' }}
          >
            6
          </div>
        </div>
      </div>

      {/* Course Cards */}
      {courses.length === 0 ? (
        <div className="empty-state glass-card-static">
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-title">ምንም የተመዘገበ ኮርስ የለም</div>
          <div className="empty-state-text">
            እስካሁን በየትኛውም ኮርስ አልተመዘገቡም። አስተማሪዎ በኮርሶች ውስጥ ይመዘግብዎታል።
          </div>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => {
            const rankBadge = course.has_result ? getRankBadge(course.rank) : null;
            return (
              <div
                key={course.course_id}
                className="course-card"
                onClick={() => course.has_result && navigate(`/student/courses/${course.course_id}/result`)}
                style={{ cursor: course.has_result ? 'pointer' : 'default' }}
              >
                <div className="flex justify-between items-center">
                  <div className="course-code">{course.course_code}</div>
                  {course.has_result ? (
                    <span
                      className="badge"
                      style={{
                        color: rankBadge.color,
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: `1px solid ${rankBadge.color}40`,
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 700,
                        padding: 'var(--space-1) var(--space-3)',
                      }}
                    >
                      {rankBadge.icon} {rankBadge.label}
                    </span>
                  ) : (
                    <span className="badge badge-warning">ውጤት በመዘጋጀት ላይ</span>
                  )}
                </div>

                <div className="course-name">{course.course_name}</div>

                <div className="course-meta">

                  {course.has_result && (
                    <div className="course-meta-item">
                      {course.passed ? (
                        <span className="badge badge-success">አልፏል (PASSED)</span>
                      ) : (
                        <span className="badge badge-error">ወድቋል (FAILED)</span>
                      )}
                    </div>
                  )}
                </div>

                {course.has_result && (
                  <div
                    style={{
                      marginTop: 'var(--space-3)',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--accent-primary)',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>ዝርዝር የደረጃ ሰንጠረዥ ይመልከቱ →</span>
                    <span style={{ color: 'var(--text-secondary)' }}>አጠቃላይ ውጤት: {course.total_score}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
