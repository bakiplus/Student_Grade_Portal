/**
 * LoginPage — የተማሪዎች እና የአስተማሪዎች መግቢያ ፖርታል (Amharic Login Portal).
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ mode: initialMode = 'student' }) {
  const isInstructorMode = initialMode === 'instructor';

  // Student form state
  const [studentId, setStudentId] = useState('');
  const [firstName, setFirstName] = useState('');

  // Instructor form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginStudent, loginInstructor } = useAuth();
  const navigate = useNavigate();

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginStudent(studentId.trim(), firstName.trim());
      navigate('/student/dashboard');
    } catch (err) {
      let msg =
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        err.response?.data?.student_id?.[0] ||
        err.response?.data?.first_name?.[0];

      if (!msg) {
        if (err.message === 'Network Error' || !err.response) {
          msg = 'ከሰርቨሩ ጋር መገናኘት አልተቻለም። እባክዎ ኢንተርኔትዎን ያረጋግጡ (Server is starting or offline).';
        } else {
          msg = 'የተማሪ መታወቂያ ወይም የመጀመሪያ ስም አልተገኘም። እባክዎ በትክክል ያስገቡ።';
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleInstructorSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginInstructor(username.trim(), password);
      navigate('/instructor/dashboard');
    } catch (err) {
      let msg =
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        err.response?.data?.username?.[0] ||
        err.response?.data?.password?.[0];

      if (!msg) {
        if (err.message === 'Network Error' || !err.response) {
          msg = 'ከሰርቨሩ ጋር መገናኘት አልተቻለም። እባክዎ ኢንተርኔትዎን ያረጋግጡ (Server is starting or offline).';
        } else {
          msg = 'የተሳሳተ የተጠቃሚ ስም ወይም የይለፍ ቃል።';
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card slide-up">
        <div className="login-header">
          <div className="login-logo">የውጤት ፖርታል</div>
          <div className="login-tagline">
            {isInstructorMode ? '👨‍🏫 የአስተማሪ እና አድሚን መግቢያ' : '🎓 የተማሪዎች የውጤት መመልከቻ ፖርታል'}
          </div>
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-muted)',
              marginTop: 'var(--space-1)',
              marginBottom: 0,
            }}
          >
            {isInstructorMode
              ? 'የተፈቀደላቸው መምህራን እና የአስተዳዳሪዎች መግቢያ'
              : 'ያለ ይለፍ ቃል በተማሪ መታወቂያ እና የመጀመሪያ ስም ብቻ ውጤትዎን ይመልከቱ'}
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {!isInstructorMode ? (
          /* Student Login Form — Strictly for Students (ID + First Name) */
          <form className="login-form" onSubmit={handleStudentSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="studentId">
                የተማሪ መታወቂያ ቁጥር (Student ID)
              </label>
              <input
                id="studentId"
                className="form-input"
                type="text"
                placeholder="ለምሳሌ፡ STU-260001"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="firstName">
                የመጀመሪያ ስም (First Name)
              </label>
              <input
                id="firstName"
                className="form-input"
                type="text"
                placeholder="ለምሳሌ፡ Nuhamin ወይም Betelhem"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                የተመዘገቡበትን የመጀመሪያ ስምዎን ያስገቡ (የይለፍ ቃል አያስፈልግም)
              </span>
            </div>

            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? 'መረጃዎን በማረጋገጥ ላይ...' : 'ውጤቴን እና ደረጃዬን አሳይ →'}
            </button>

            {/* Link to Instructor Portal */}
            <div
              style={{
                textAlign: 'center',
                marginTop: 'var(--space-4)',
                paddingTop: 'var(--space-3)',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              አስተማሪ ወይም አድሚን ነዎት?{' '}
              <Link to="/instructor/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                የአስተማሪ መግቢያ →
              </Link>
            </div>
          </form>
        ) : (
          /* Instructor Login Form — Strictly for Instructors */
          <form className="login-form" onSubmit={handleInstructorSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                የተጠቃሚ ስም ወይም ኢሜይል (Username / Email)
              </label>
              <input
                id="username"
                className="form-input"
                type="text"
                placeholder="biruk ወይም Isaac ወይም admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                የይለፍ ቃል (Password)
              </label>
              <input
                id="password"
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? 'በመግባት ላይ...' : 'ግባ (Sign In) →'}
            </button>

            {/* Link to Student Portal */}
            <div
              style={{
                textAlign: 'center',
                marginTop: 'var(--space-4)',
                paddingTop: 'var(--space-3)',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              ተማሪ ነዎት?{' '}
              <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                የተማሪዎች ውጤት መመልከቻ →
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
