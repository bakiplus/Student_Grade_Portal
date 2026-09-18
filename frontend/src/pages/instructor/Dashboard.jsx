/**
 * Instructor Dashboard — የአስተማሪ ዳሽቦርድ (Amharic Instructor Dashboard).
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

export default function InstructorDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses/');
      setCourses(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <div className="loading-text">ኮርሶችን በመጫን ላይ...</div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header-actions">
        <div className="page-header">
          <h1 className="page-title">የአስተማሪ ዳሽቦርድ</h1>
          <p className="page-subtitle">ኮርሶችዎን፣ የተማሪዎች ውጤት እና ይፋዊ ደረጃዎችን ያስተዳድሩ</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/instructor/courses/create')}
        >
          ➕ አዲስ ኮርስ ፍጠር
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">ጠቅላላ ኮርሶች</div>
          <div className="stat-value">{courses.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">ጠቅላላ የተመዘገቡ ተማሪዎች</div>
          <div className="stat-value">
            {courses.reduce((sum, c) => sum + (c.enrolled_count || 0), 0)}
          </div>
          <div className="stat-meta">በሁሉም ኮርሶች</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">ለውጤት ዝግጁ የሆኑ</div>
          <div className="stat-value">
            {courses.filter((c) => c.components_weight_total === '100.00' || c.components_weight_total == 100).length}
          </div>
          <div className="stat-meta">የፈተና ክፍሎች ድምር = 100%</div>
        </div>
      </div>

      {/* Course Grid */}
      {courses.length === 0 ? (
        <div className="empty-state glass-card-static">
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-title">ምንም ኮርስ አልተፈጠረም</div>
          <div className="empty-state-text">
            ውጤቶችን እና ተማሪዎችን ለማስተዳደር የመጀመሪያ ኮርስዎን አሁን ይፍጠሩ።
          </div>
          <button
            className="btn btn-primary mt-6"
            onClick={() => navigate('/instructor/courses/create')}
          >
            አዲስ ኮርስ ፍጠር
          </button>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => (
            <div
              key={course.id}
              className="course-card"
              onClick={() => navigate(`/instructor/courses/${course.id}`)}
            >
              <div className="course-code">{course.code}</div>
              <div className="course-name">{course.name}</div>
              <div className="course-meta">
                <div className="course-meta-item">
                  👥 {course.enrolled_count || 0} ተማሪዎች
                </div>
                <div className="course-meta-item">
                  📝 {course.credit_hours} ክሬዲት
                </div>
                <div className="course-meta-item">
                  {parseFloat(course.components_weight_total) === 100 ? (
                    <span className="badge badge-success">ዝግጁ (100%)</span>
                  ) : (
                    <span className="badge badge-warning">{course.components_weight_total}% የተሞላ</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
