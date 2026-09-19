/**
 * CourseResult — የተማሪ የኮርስ ውጤት እና የክፍል ደረጃ ዝርዝር (Amharic Course Result).
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StudentAvatar from '../../components/StudentAvatar';

export default function CourseResult() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResult();
  }, [courseId]);

  const fetchResult = async () => {
    try {
      const res = await api.get(`/student/courses/${courseId}/result/`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'ውጤትዎን መጫን አልተቻለም።');
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return { icon: '🥇', label: '1ኛ ደረጃ (አንደኛ)', color: '#fbbf24' };
    if (rank === 2) return { icon: '🥈', label: '2ኛ ደረጃ', color: '#94a3b8' };
    if (rank === 3) return { icon: '🥉', label: '3ኛ ደረጃ', color: '#d97706' };
    return { icon: '🏆', label: `${rank}ኛ ደረጃ`, color: '#38bdf8' };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <div className="loading-text">የተረጋገጠ ውጤትዎን በመጫን ላይ...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <button className="btn btn-secondary mb-4" onClick={() => navigate('/student/dashboard')}>
            ← ወደ ኮርሶች ተመለስ
          </button>
        </div>
        <div className="empty-state glass-card-static">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">{error}</div>
          <div className="empty-state-text">
            እባክዎ ቆየት ብለው እንደገና ይመልከቱ። አስተማሪዎ ውጤቱን እንዳጠናቀቀ ያትመዋል።
          </div>
        </div>
      </div>
    );
  }

  const rankInfo = getRankBadge(result.rank);

  return (
    <div className="fade-in">
      <button className="btn btn-secondary mb-6" onClick={() => navigate('/student/dashboard')}>
        ← ወደ ኮርሶች ተመለስ
      </button>

      {/* Student Profile & Credential Card */}
      <div className="student-profile-header slide-up">
        <StudentAvatar photoUrl={result.student_photo_url || user?.photo_url} name={result.student_name} size="xl" />

        <div className="student-profile-details">
          <div className="student-id-tag">የተማሪ መታወቂያ፡ {result.student_id || user?.student_id}</div>
          <h2 className="student-name-heading">{result.student_name || `${user?.first_name} ${user?.last_name}`}</h2>
          <div className="student-meta-row">
            <span>📚 <strong>፡</strong> {result.course_code} — {result.course_name}</span>
          </div>
        </div>
      </div>

      {/* Result Hero — Purely Rank-Based Labeling */}
      <div className="result-hero slide-up" style={{ marginTop: 'var(--space-6)' }}>
        <div className="result-rank-icon">{rankInfo.icon}</div>

        <div className="result-rank-title" style={{ color: rankInfo.color }}>
          {result.rank}ኛ ደረጃ
        </div>

        <div className="result-rank-subtitle">
          {result.total_enrolled
            ? `ከተመዘገቡ ${result.total_enrolled} ተማሪዎች መካከል ${result.rank}ኛ ደረጃ አግኝተዋል`
            : rankInfo.label}
        </div>

        <div className="result-score-container">
          <div className="result-score-val">
            አጠቃላይ ውጤት፡ <strong>{result.total_score}%</strong>
          </div>
          <span
            className={`badge ${result.passed ? 'badge-success' : 'badge-error'}`}
            style={{ fontSize: 'var(--font-size-sm)', padding: 'var(--space-2) var(--space-5)' }}
          >
            {result.passed ? '✅ (PASSED)' : '❌ ወድቋል (FAILED)'}
          </span>
        </div>
      </div>

      {/* Grade Breakdown */}
      <h2
        style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 700,
          marginTop: 'var(--space-8)',
          marginBottom: 'var(--space-4)',
          color: 'var(--text-primary)',
        }}
      >
        የፈተና ክፍሎች ዝርዝር ውጤት
      </h2>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>የግምገማ/የፈተና ክፍል</th>
              <th>የተገኘ ውጤት</th>
              {/* <th>ከፍተኛ ውጤት</th>
              <th>መቶኛ ድርሻ</th> */}
              <th>የተሰላ ውጤት</th>
            </tr>
          </thead>
          <tbody>
            {result.grade_breakdown?.map((item, idx) => (
              <tr key={idx}>
                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.component}</td>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.score}</td>
                <td>{item.max_score}</td>
                <td>
                  <span className="badge badge-info">{item.weight}%</span>
                </td>
                <td style={{ fontWeight: 600, color: 'var(--accent-primary-hover)' }}>{item.weighted_score}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--border-medium)' }}>
              <td colSpan="4" style={{ fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>
                ጠቅላላ የተደመረ ውጤት፡
              </td>
              <td
                style={{
                  fontWeight: 800,
                  fontSize: 'var(--font-size-lg)',
                  background: 'var(--accent-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {result.total_score}%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Published timestamp */}
      {result.published_at && (
        <p
          style={{
            marginTop: 'var(--space-6)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}
        >
          ይፋዊ ውጤት የወጣበት ቀን፡ {new Date(result.published_at).toLocaleString('am-ET')}
        </p>
      )}
    </div>
  );
}
