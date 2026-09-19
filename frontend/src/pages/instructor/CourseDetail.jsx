/**
 * CourseDetail — የተማሪዎች፣ የፈተና ክፍሎች፣ የውጤት መዝገብ እና ይፋዊ ደረጃዎች ማስተዳደሪያ።
 * Tabs: ተማሪዎች (Students), የፈተና ክፍሎች (Components), የውጤት መዝገብ (Grades), ይፋዊ ደረጃዎች (Results)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import StudentAvatar from '../../components/StudentAvatar';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await api.get(`/courses/${id}/`);
      setCourse(res.data);
    } catch {
      navigate('/instructor/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  if (loading || !course) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <div className="loading-text">የኮርስ መረጃዎችን በመጫን ላይ...</div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header-actions">
        <div className="page-header">
          <div className="course-code" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-1)' }}>
            {course.code}
          </div>
          <h1 className="page-title">{course.name}</h1>
          <p className="page-subtitle">
            {course.credit_hours} የክሬዲት ሰዓት · {course.enrolled_count || 0} ተማሪዎች
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/instructor/dashboard')}
        >
          ← ወደ ዳሽቦርድ ተመለስ
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.type === 'success' ? '✅' : '⚠️'} {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {[
          { key: 'students', label: '👥 ተማሪዎች' },
          { key: 'components', label: '📋 የፈተና ክፍሎች' },
          { key: 'grades', label: '✏️ የውጤት መዝገብ' },
          { key: 'results', label: '📊 ይፋዊ ደረጃዎች' },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'students' && (
        <StudentsTab courseId={id} onMessage={showMessage} onRefresh={fetchCourse} />
      )}
      {activeTab === 'components' && (
        <ComponentsTab courseId={id} course={course} onMessage={showMessage} onRefresh={fetchCourse} />
      )}
      {activeTab === 'grades' && (
        <GradesTab courseId={id} onMessage={showMessage} />
      )}
      {activeTab === 'results' && (
        <ResultsTab courseId={id} onMessage={showMessage} />
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   Students Tab — የተማሪዎች ዝርዝር እና ምዝገባ
   ═══════════════════════════════════════════════════════════ */

function StudentsTab({ courseId, onMessage, onRefresh }) {
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, [courseId]);

  const fetchStudents = async () => {
    try {
      const res = await api.get(`/courses/${courseId}/students/?page_size=1000`);
      setStudents(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEnrollModal = async () => {
    try {
      const res = await api.get('/auth/students/?page_size=1000');
      setAllStudents(res.data.results || res.data || []);
      setSelectedStudents([]);
      setSearch('');
      setShowEnrollModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEnroll = async () => {
    if (selectedStudents.length === 0) return;
    try {
      const res = await api.post(`/courses/${courseId}/enroll/`, {
        student_ids: selectedStudents,
      });
      onMessage(`${res.data.enrolled.length} ተማሪ(ዎች) በተሳካ ሁኔታ በኮርሱ ተመዝግበዋል!`);
      setShowEnrollModal(false);
      fetchStudents();
      onRefresh();
    } catch (err) {
      onMessage(err.response?.data?.detail || 'ተማሪዎችን መመዝገብ አልተቻለም።', 'error');
    }
  };

  const handleRemove = async (studentId) => {
    if (!confirm('ይህን ተማሪ ከዚህ ኮርስ ማስወገድ ይፈልጋሉ?')) return;
    try {
      await api.delete(`/courses/${courseId}/students/${studentId}/`);
      onMessage('ተማሪው ከኮርሱ ተወግዷል።');
      fetchStudents();
      onRefresh();
    } catch (err) {
      onMessage('ተማሪውን ማስወገድ አልተቻለም።', 'error');
    }
  };

  const enrolledIds = new Set(students.map((e) => e.student_detail?.id || e.student));
  const availableStudents = allStudents.filter((s) => !enrolledIds.has(s.id));
  const filteredAvailable = availableStudents.filter((s) =>
    `${s.first_name} ${s.last_name} ${s.student_id} ${s.username} ${s.email || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handleSelectAll = () => {
    const allFilteredIds = filteredAvailable.map((s) => s.id);
    const newSelected = Array.from(new Set([...selectedStudents, ...allFilteredIds]));
    setSelectedStudents(newSelected);
  };

  const handleDeselectAll = () => {
    const filteredSet = new Set(filteredAvailable.map((s) => s.id));
    setSelectedStudents(selectedStudents.filter((id) => !filteredSet.has(id)));
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h3 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          የተመዘገቡ ተማሪዎች ({students.length})
        </h3>
        <button className="btn btn-primary btn-sm" onClick={openEnrollModal}>
          ➕ ተማሪዎችን መዝግብ
        </button>
      </div>

      {students.length === 0 ? (
        <div className="empty-state glass-card-static">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-title">ምንም የተመዘገበ ተማሪ የለም</div>
          <div className="empty-state-text">
            ውጤቶችን ለማስተዳደር ተማሪዎችን በኮርሱ ይመዝግቡ።
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ፎቶ</th>
                <th>የተማሪ መታወቂያ</th>
                <th>ሙሉ ስም</th>
                <th>የተጠቃሚ ስም</th>
                <th>ኢሜይል</th>
                <th>ድርጊቶች</th>
              </tr>
            </thead>
            <tbody>
              {students.map((enrollment) => {
                const s = enrollment.student_detail;
                return (
                  <tr key={enrollment.id}>
                    <td>
                      <StudentAvatar student={s} size="sm" />
                    </td>
                    <td><span className="badge badge-info">{s?.student_id || '—'}</span></td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {s?.first_name} {s?.last_name}
                    </td>
                    <td>{s?.username}</td>
                    <td>{s?.email || '—'}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemove(s?.id)}
                      >
                        አስወግድ
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="modal-overlay" onClick={() => setShowEnrollModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div className="modal-title">ተማሪዎችን በኮርሱ መዝግብ</div>
              <button className="btn btn-ghost" onClick={() => setShowEnrollModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <input
                className="form-input mb-3"
                placeholder="ተማሪዎችን በስም፣ በመታወቂያ ቁጥር ወይም በኢሜይል ፈልግ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />

              <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                <span className="text-muted" style={{ fontSize: 'var(--font-size-xs)' }}>
                  የሚገኙ ተማሪዎች፡ <strong>{filteredAvailable.length}</strong> (የተመረጡ፡ {selectedStudents.length})
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 'var(--font-size-xs)', padding: '2px 8px' }}
                    onClick={handleSelectAll}
                  >
                    ✓ ሁሉንም ምረጥ
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 'var(--font-size-xs)', padding: '2px 8px' }}
                    onClick={handleDeselectAll}
                  >
                    ✕ አትምረጥ
                  </button>
                </div>
              </div>

              {filteredAvailable.length === 0 ? (
                <p className="text-muted" style={{ fontSize: 'var(--font-size-sm)', padding: 'var(--space-4)', textAlign: 'center' }}>
                  ምንም የሚመዘገብ ተማሪ አልተገኘም።
                </p>
              ) : (
                <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {filteredAvailable.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-3"
                      style={{
                        padding: 'var(--space-2) var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        background: selectedStudents.includes(s.id) ? 'rgba(99,102,241,0.14)' : 'rgba(255,255,255,0.03)',
                        border: selectedStudents.includes(s.id) ? '1px solid var(--accent-primary)' : '1px solid transparent',
                        transition: 'all 0.15s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents([...selectedStudents, s.id]);
                          } else {
                            setSelectedStudents(selectedStudents.filter((id) => id !== s.id));
                          }
                        }}
                        style={{ accentColor: 'var(--accent-primary)', width: 18, height: 18 }}
                      />
                      <StudentAvatar student={s} size="sm" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                          {s.first_name} {s.last_name}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                          <span className="badge badge-info" style={{ fontSize: '10px', padding: '1px 5px', marginRight: 6 }}>
                            {s.student_id || 'ID የለውም'}
                          </span>
                          {s.username}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEnrollModal(false)}>
                ይቅር
              </button>
              <button
                className="btn btn-primary"
                onClick={handleEnroll}
                disabled={selectedStudents.length === 0}
              >
                መዝግብ ({selectedStudents.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   Components Tab — የፈተና ክፍሎች ማስተዳደሪያ
   ═══════════════════════════════════════════════════════════ */

function ComponentsTab({ courseId, onMessage, onRefresh }) {
  const [components, setComponents] = useState([]);
  const [form, setForm] = useState({ name: '', max_score: '100', weight_percent: '', display_order: 0 });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComponents();
  }, [courseId]);

  const fetchComponents = async () => {
    try {
      const res = await api.get(`/courses/${courseId}/components/`);
      setComponents(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/components/${editing}/`, { ...form, course: courseId });
        onMessage('የፈተና ክፍሉ ተስተካክሏል።');
      } else {
        await api.post(`/courses/${courseId}/components/`, { ...form, course: courseId });
        onMessage('አዲስ የፈተና ክፍል ተጨምሯል።');
      }
      setForm({ name: '', max_score: '100', weight_percent: '', display_order: 0 });
      setEditing(null);
      fetchComponents();
      onRefresh();
    } catch (err) {
      const data = err.response?.data;
      const msg =
        data?.non_field_errors?.[0] ||
        data?.detail ||
        Object.values(data || {}).flat().join(', ') ||
        'የፈተና ክፍሉን ማስቀመጥ አልተቻለም።';
      onMessage(msg, 'error');
    }
  };

  const handleEdit = (comp) => {
    setForm({
      name: comp.name,
      max_score: comp.max_score,
      weight_percent: comp.weight_percent,
      display_order: comp.display_order,
    });
    setEditing(comp.id);
  };

  const handleDelete = async (compId) => {
    if (!confirm('ይህን የፈተና ክፍል መሰረዝ ይፈልጋሉ?')) return;
    try {
      await api.delete(`/components/${compId}/`);
      onMessage('የፈተና ክፍሉ ተሰርዟል።');
      fetchComponents();
      onRefresh();
    } catch (err) {
      onMessage('የፈተና ክፍሉን መሰረዝ አልተቻለም።', 'error');
    }
  };

  const totalWeight = components.reduce((sum, c) => sum + parseFloat(c.weight_percent || 0), 0);

  if (loading) {
    return <div className="loading-container"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          የፈተና ክፍሎች
          <span
            style={{
              fontWeight: 400,
              color: totalWeight === 100 ? 'var(--success)' : 'var(--warning)',
              marginLeft: 'var(--space-3)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            (አጠቃላይ፡ {totalWeight}% / 100%)
          </span>
        </h3>
      </div>

      {/* Add/Edit Form */}
      <form onSubmit={handleSubmit} className="glass-card-static mb-6">
        <div style={{ marginBottom: 'var(--space-4)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
          {editing ? 'የፈተና ክፍል አስተካክል' : 'አዲስ የፈተና ክፍል ጨምር'}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">የክፍል ስም (Component Name) *</label>
            <input
              className="form-input"
              placeholder="ለምሳሌ፡ Midterm Exam ወይም አጋማሽ ፈተና"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">ከፍተኛ ውጤት (Max Score) *</label>
            <input
              className="form-input"
              type="number"
              min="1"
              placeholder="100"
              value={form.max_score}
              onChange={(e) => setForm({ ...form, max_score: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">ክብደት % (Weight %) *</label>
            <input
              className="form-input"
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="25"
              value={form.weight_percent}
              onChange={(e) => setForm({ ...form, weight_percent: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">ቅደም ተከተል (Order)</label>
            <input
              className="form-input"
              type="number"
              min="0"
              value={form.display_order}
              onChange={(e) => setForm({ ...form, display_order: e.target.value })}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button type="submit" className="btn btn-primary btn-sm">
            {editing ? 'አሻሽል' : 'ክፍል ጨምር'}
          </button>
          {editing && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setEditing(null);
                setForm({ name: '', max_score: '100', weight_percent: '', display_order: 0 });
              }}
            >
              ይቅር
            </button>
          )}
        </div>
      </form>

      {/* Components Table */}
      {components.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ቅደም ተከተል</th>
                <th>የፈተና ክፍል</th>
                <th>ከፍተኛ ውጤት</th>
                <th>ክብደት %</th>
                <th>ድርጊቶች</th>
              </tr>
            </thead>
            <tbody>
              {components.map((comp) => (
                <tr key={comp.id}>
                  <td>{comp.display_order}</td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{comp.name}</td>
                  <td>{comp.max_score}</td>
                  <td>
                    <span className="badge badge-info">{comp.weight_percent}%</span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(comp)}>
                        አስተካክል
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(comp.id)}>
                        ሰርዝ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   Grades Tab — የውጤት መመዝገቢያ ሰንጠረዥ
   ═══════════════════════════════════════════════════════════ */

function GradesTab({ courseId, onMessage }) {
  const [gradesData, setGradesData] = useState(null);
  const [editedGrades, setEditedGrades] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrades();
  }, [courseId]);

  const fetchGrades = async () => {
    try {
      const res = await api.get(`/courses/${courseId}/grades/`);
      setGradesData(res.data);
      // Initialize edited grades from existing data
      const initial = {};
      res.data.students.forEach((student) => {
        student.grades.forEach((grade) => {
          const key = `${student.enrollment_id}-${grade.component_id}`;
          initial[key] = grade.score || '';
        });
      });
      setEditedGrades(initial);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (enrollmentId, componentId, value) => {
    const key = `${enrollmentId}-${componentId}`;
    setEditedGrades({ ...editedGrades, [key]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    const grades = [];

    Object.entries(editedGrades).forEach(([key, score]) => {
      if (score === '' || score === null) return;
      const [enrollmentId, componentId] = key.split('-');
      grades.push({
        enrollment_id: parseInt(enrollmentId),
        component_id: parseInt(componentId),
        score: parseFloat(score),
      });
    });

    if (grades.length === 0) {
      onMessage('የሚቀመጥ ምንም ውጤት የለም።', 'warning');
      setSaving(false);
      return;
    }

    try {
      const res = await api.post(`/courses/${courseId}/grades/`, { grades });
      onMessage(`${res.data.saved} የፈተና ውጤት(ቶች) በተሳካ ሁኔታ ተመዝግቧል!`);
      if (res.data.errors?.length) {
        onMessage(`አንዳንድ ስህተቶች አጋጥመዋል፡ ${res.data.errors.join('; ')}`, 'warning');
      }
      fetchGrades();
    } catch (err) {
      onMessage(err.response?.data?.detail || 'ውጤቶችን መመዝገብ አልተቻለም።', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner" /></div>;
  }

  if (!gradesData || !gradesData.components?.length) {
    return (
      <div className="empty-state glass-card-static">
        <div className="empty-state-icon">📋</div>
        <div className="empty-state-title">ምንም የፈተና ክፍል አልተዘጋጀም</div>
        <div className="empty-state-text">
          ውጤት ከማስገባትዎ በፊት መጀመሪያ የፈተና ክፍሎችን ያክሉ።
        </div>
      </div>
    );
  }

  if (!gradesData.students?.length) {
    return (
      <div className="empty-state glass-card-static">
        <div className="empty-state-icon">👥</div>
        <div className="empty-state-title">ምንም የተመዘገበ ተማሪ የለም</div>
        <div className="empty-state-text">
          ውጤት ከማስገባትዎ በፊት መጀመሪያ ተማሪዎችን ይመዝግቡ።
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          የውጤት መመዝገቢያ
        </h3>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'በመመዝገብ ላይ...' : '💾 ሁሉንም ውጤቶች መዝግብ'}
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ፎቶ</th>
              <th>ተማሪ</th>
              <th>መታወቂያ</th>
              {gradesData.components.map((comp) => (
                <th key={comp.id} style={{ textAlign: 'center' }}>
                  {comp.name}
                  <div style={{ fontWeight: 400, fontSize: '0.65rem', opacity: 0.7 }}>
                    ከፍተኛ፡ {comp.max_score} ({comp.weight_percent}%)
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gradesData.students.map((student) => (
              <tr key={student.enrollment_id}>
                <td>
                  <StudentAvatar
                    student={{ first_name: student.student_name, photo_url: student.photo_url }}
                    size="sm"
                  />
                </td>
                <td style={{ color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {student.student_name}
                </td>
                <td>
                  <span className="badge badge-info">{student.student_id}</span>
                </td>
                {student.grades.map((grade) => {
                  const key = `${student.enrollment_id}-${grade.component_id}`;
                  const maxScore = parseFloat(grade.max_score);
                  const currentVal = editedGrades[key] || '';
                  const isInvalid = currentVal !== '' && parseFloat(currentVal) > maxScore;

                  return (
                    <td key={grade.component_id} style={{ textAlign: 'center' }}>
                      <input
                        className={`grade-input ${isInvalid ? 'invalid' : ''}`}
                        type="number"
                        min="0"
                        max={maxScore}
                        step="0.01"
                        placeholder="—"
                        value={currentVal}
                        onChange={(e) =>
                          handleGradeChange(
                            student.enrollment_id,
                            grade.component_id,
                            e.target.value
                          )
                        }
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   Results Tab — ይፋዊ ውጤቶች እና ደረጃዎች
   ═══════════════════════════════════════════════════════════ */

function ResultsTab({ courseId, onMessage }) {
  const [results, setResults] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, [courseId]);

  const fetchResults = async () => {
    try {
      const res = await api.get(`/courses/${courseId}/results/`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const res = await api.post(`/courses/${courseId}/calculate/`);
      onMessage(res.data.detail || 'ውጤቶች እና ደረጃዎች በተሳካ ሁኔታ ተሰልተዋል!');
      fetchResults();
    } catch (err) {
      onMessage(err.response?.data?.detail || 'ውጤቶችን ማስላት አልተቻለም።', 'error');
    } finally {
      setCalculating(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm('ውጤቱን ይፋ ማድረግ ይፈልጋሉ? ተማሪዎች ውጤታቸውን እና ደረጃቸውን ወዲያውኑ ማየት ይችላሉ።')) return;
    setPublishing(true);
    try {
      const res = await api.post(`/courses/${courseId}/publish/`);
      onMessage(res.data.detail || 'ውጤቶች ለተማሪዎች ይፋ ሆነዋል!');
      fetchResults();
    } catch (err) {
      onMessage(err.response?.data?.detail || 'ውጤቶችን ይፋ ማድረግ አልተቻለም።', 'error');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner" /></div>;
  }

  const resultsList = results?.results || [];
  const hasUnpublished = resultsList.some((r) => !r.is_published);
  const hasResults = resultsList.length > 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h3 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          ይፋዊ ደረጃዎች እና ውጤቶች {hasResults && `(${resultsList.length} ተማሪዎች)`}
        </h3>
        <div className="flex gap-3">
          <button
            className="btn btn-secondary"
            onClick={handleCalculate}
            disabled={calculating}
          >
            {calculating ? 'በማስላት ላይ...' : '🔄 ውጤቶችን አስላ'}
          </button>
          {hasUnpublished && (
            <button
              className="btn btn-success"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? 'ይፋ በማድረግ ላይ...' : '📢 ይፋ አድርግ (Publish)'}
            </button>
          )}
        </div>
      </div>

      {!hasResults ? (
        <div className="empty-state glass-card-static">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">እስካሁን የተሰላ ውጤት የለም</div>
          <div className="empty-state-text">
            መጀመሪያ ሁሉንም ውጤቶች ያስገቡ፣ ከዚያም አጠቃላይ ውጤት እና ደረጃ ለማስላት "ውጤቶችን አስላ" የሚለውን ይጫኑ።
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ደረጃ (Rank)</th>
                <th>ፎቶ</th>
                <th>ተማሪ</th>
                <th>የተማሪ መታወቂያ</th>
                <th>ጠቅላላ ውጤት</th>
                <th>ሁኔታ</th>
                <th>ይፋዊነት</th>
              </tr>
            </thead>
            <tbody>
              {resultsList.map((result) => (
                <tr key={result.id}>
                  <td>
                    <span
                      style={{
                        fontWeight: 700,
                        color: result.rank <= 3 ? 'var(--accent-primary-hover)' : 'var(--text-secondary)',
                        fontSize: result.rank <= 3 ? 'var(--font-size-base)' : 'var(--font-size-sm)',
                      }}
                    >
                      {result.rank === 1 && '🥇 '}
                      {result.rank === 2 && '🥈 '}
                      {result.rank === 3 && '🥉 '}
                      #{result.rank}
                    </span>
                  </td>
                  <td>
                    <StudentAvatar
                      photoUrl={result.student_photo_url}
                      name={result.student_name}
                      size="sm"
                    />
                  </td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    {result.student_name}
                  </td>
                  <td>
                    <span className="badge badge-info">{result.student_id}</span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {result.total_score}%
                  </td>
                  <td>
                    <span className={`badge ${result.passed ? 'badge-success' : 'badge-error'}`}>
                      {result.passed ? '✅ አልፏል' : '❌ ወድቋል'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${result.is_published ? 'badge-success' : 'badge-warning'}`}>
                      {result.is_published ? '📢 ይፋ ሆኗል' : '📝 ረቂቅ'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
