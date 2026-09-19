/**
 * ManageStudents — የተማሪዎች አስተዳደር እና የፎቶ ማስተካከያ (Amharic Manage Students).
 * Full support for optional student photos with blank state and Cloudinary uploads.
 */

import { useState } from 'react';
import api from '../../api/client';
import StudentAvatar from '../../components/StudentAvatar';

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    first_name: '',
    last_name: '',
    photo_url: '',
    username: '',
    email: '',
  });

  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    photo_url: '',
    email: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fetched, setFetched] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/students/?page_size=1000');
      setStudents(res.data.results || res.data || []);
      setFetched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!fetched) fetchStudents();

  // Handle Photo Upload (for either create or edit modal)
  const handlePhotoUpload = async (file, isEdit = false) => {
    if (!file) return;

    setUploadingPhoto(true);
    setError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/auth/upload-photo/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = res.data?.photo_url;
      if (uploadedUrl) {
        if (isEdit) {
          setEditForm((prev) => ({ ...prev, photo_url: uploadedUrl }));
        } else {
          setCreateForm((prev) => ({ ...prev, photo_url: uploadedUrl }));
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'ፎቶውን መጫን አልተቻለም። እባክዎ እንደገና ይሞክሩ።');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (student) => {
    setError('');
    setSuccess('');
    setEditingStudent(student);
    const existingPhoto = (student.photo_url && !student.photo_url.includes('dicebear')) ? student.photo_url : '';
    setEditForm({
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      photo_url: existingPhoto,
      email: student.email || '',
    });
  };

  // Handle Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;

    setSavingEdit(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.patch(`/auth/students/${editingStudent.id}/`, editForm);
      const updatedStudent = res.data;

      setStudents((prev) =>
        prev.map((s) => (s.id === editingStudent.id ? updatedStudent : s))
      );
      setSuccess(`ለተማሪ ${updatedStudent.first_name} ${updatedStudent.last_name} ፎቶ እና መረጃ በተሳካ ሁኔታ ተስተካክሏል!`);
      setTimeout(() => {
        setEditingStudent(null);
        setSuccess('');
      }, 1500);
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const messages = Object.entries(data)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join('\n');
        setError(messages);
      } else {
        setError('የተማሪውን መረጃ ማስተካከል አልተቻለም።');
      }
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Create Student
  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/auth/students/', createForm);
      setSuccess(
        `ተማሪው በተሳካ ሁኔታ ተመዝግቧል! መታወቂያ፡ ${res.data.student_id} | የመግቢያ ቁልፍ፡ "${res.data.first_name}"`
      );
      setCreateForm({ first_name: '', last_name: '', photo_url: '', username: '', email: '' });
      fetchStudents();
      setTimeout(() => {
        setShowCreateModal(false);
        setSuccess('');
      }, 2000);
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const messages = Object.entries(data)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join('\n');
        setError(messages);
      } else {
        setError('ተማሪውን መመዝገብ አልተቻለም።');
      }
    }
  };

  // Filter students based on search query
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
    const id = (s.student_id || '').toLowerCase();
    const username = (s.username || '').toLowerCase();
    const email = (s.email || '').toLowerCase();
    return fullName.includes(q) || id.includes(q) || username.includes(q) || email.includes(q);
  });

  return (
    <div className="fade-in">
      <div className="page-header-actions">
        <div className="page-header">
          <h1 className="page-title">ተማሪዎችን አስተዳድር</h1>
          <p className="page-subtitle">
            የተማሪዎች ዝርዝር፣ የተማሪ መታወቂያ እና ፎቶዎች (ፎቶ አማራጭ ነው) — ጠቅላላ {students.length} ተማሪዎች
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button
            className="btn btn-primary"
            onClick={() => {
              setError('');
              setSuccess('');
              setShowCreateModal(true);
            }}
          >
            ➕ አዲስ ተማሪ መዝግብ
          </button>
        </div>
      </div>

      {/* Search Bar & Controls */}
      <div style={{ marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            className="form-input"
            type="text"
            placeholder="🔍 ተማሪዎችን በስም፣ በመታወቂያ ቁጥር (ለምሳሌ፡ STU-260001) ወይም በተጠቃሚ ስም ይፈልጉ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
          <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
            🔍
          </span>
        </div>
        {searchQuery && (
          <button className="btn btn-secondary" onClick={() => setSearchQuery('')} style={{ fontSize: 'var(--font-size-xs)' }}>
            ፍለጋውን አጽዳ
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="empty-state glass-card-static">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-title">
            {students.length === 0 ? 'ምንም ተማሪ አልተመዘገበም' : 'በፍለጋው የተገኘ ተማሪ የለም'}
          </div>
          <div className="empty-state-text">
            {students.length === 0
              ? 'ኮርሶችን ለመመደብ እና ውጤት ለማስገባት ተማሪዎችን ይመዝግቡ።'
              : `ለ "${searchQuery}" ምንም ውጤት አልተገኘም። እባክዎ ሌላ ስም ወይም መታወቂያ ይሞክሩ።`}
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '64px' }}>ፎቶ</th>
                <th>የተማሪ መታወቂያ</th>
                <th>ሙሉ ስም</th>
                <th>የመግቢያ ስም</th>
                <th>የፎቶ ሁኔታ</th>
                <th>የተጠቃሚ ስም</th>
                <th style={{ textAlign: 'right' }}>እርምጃዎች</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => {
                const hasCustomPhoto = Boolean(s.photo_url && !s.photo_url.includes('dicebear'));

                return (
                  <tr key={s.id}>
                    <td>
                      <StudentAvatar
                        student={s}
                        size="md"
                        onClick={() => openEditModal(s)}
                      />
                    </td>
                    <td>
                      <span className="badge badge-info">{s.student_id}</span>
                    </td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {s.first_name} {s.last_name}
                    </td>
                    <td>
                      <span className="badge badge-success" style={{ fontWeight: 600, letterSpacing: '0.02em' }}>
                        🔑 {s.first_name}
                      </span>
                    </td>
                    <td>
                      {hasCustomPhoto ? (
                        <span className="badge badge-primary" style={{ fontSize: '11px' }}>
                          📷 ፎቶ አለው
                        </span>
                      ) : (
                        <span className="badge badge-secondary" style={{ fontSize: '11px', opacity: 0.8 }}>
                          ⚪ ፎቶ የለውም (ባዶ)
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)' }}>{s.username}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditModal(s)}
                        style={{ fontSize: 'var(--font-size-xs)', padding: '4px 10px' }}
                      >
                        📸 {hasCustomPhoto ? 'ፎቶ ቀይር' : 'ፎቶ ጫን'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Student Photo & Profile Modal */}
      {editingStudent && (
        <div className="modal-overlay" onClick={() => setEditingStudent(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div className="modal-title">
                📸 የተማሪ ፎቶ እና መረጃ — {editingStudent.first_name} {editingStudent.last_name}
              </div>
              <button className="btn btn-ghost" onClick={() => setEditingStudent(null)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {error && (
                  <div className="alert alert-error">
                    <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{error}</pre>
                  </div>
                )}
                {success && <div className="alert alert-success">{success}</div>}

                {/* Photo Preview & Upload Controls */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                  }}
                >
                  <StudentAvatar
                    photoUrl={editForm.photo_url}
                    name={`${editForm.first_name} ${editForm.last_name}`}
                    size="xl"
                  />

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {editForm.first_name} {editForm.last_name}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                      መታወቂያ፡ <span className="badge badge-info">{editingStudent.student_id}</span> • የመግቢያ ቁልፍ፡{' '}
                      <span className="badge badge-success">{editForm.first_name}</span>
                    </div>
                  </div>

                  {/* Photo Actions */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', justifyContent: 'center', width: '100%' }}>
                    <label className="btn btn-primary" style={{ cursor: 'pointer', fontSize: 'var(--font-size-xs)' }}>
                      {uploadingPhoto ? '⏳ በመጫን ላይ...' : '📁 ፎቶ ይጫኑ (Upload Photo)'}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handlePhotoUpload(e.target.files?.[0], true)}
                        disabled={uploadingPhoto}
                      />
                    </label>

                    {editForm.photo_url && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setEditForm((prev) => ({ ...prev, photo_url: '' }))}
                        style={{ fontSize: 'var(--font-size-xs)', color: 'var(--danger, #ef4444)' }}
                      >
                        🗑️ ፎቶውን አስወግድ (ባዶ ይሁን)
                      </button>
                    )}
                  </div>

                  {/* Optional URL input */}
                  <div style={{ width: '100%' }}>
                    <input
                      className="form-input"
                      placeholder="ወይም የፎቶ ሊንክ ያስገቡ (አማራጭ)"
                      value={editForm.photo_url}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, photo_url: e.target.value }))}
                      style={{ fontSize: 'var(--font-size-xs)' }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px', textAlign: 'center' }}>
                      💡 ፎቶ መጫን <strong>አማራጭ</strong> ነው። ካልተጫነ ባዶ ሆኖ ይቆያል።
                    </span>
                  </div>
                </div>

                {/* Edit Names & Email */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">የመጀመሪያ ስም (የመግቢያ ቁልፍ) *</label>
                    <input
                      className="form-input"
                      value={editForm.first_name}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, first_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">የአባት ስም *</label>
                    <input
                      className="form-input"
                      value={editForm.last_name}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, last_name: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">ኢሜይል (አማራጭ)</label>
                  <input
                    className="form-input"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="student@example.com"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingStudent(null)}>
                  ይቅር
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploadingPhoto || savingEdit}>
                  {savingEdit ? 'በማስቀመጥ ላይ...' : '💾 ለውጦችን አስቀምጥ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Student Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">አዲስ ተማሪ መመዝገቢያ</div>
              <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div
                  style={{
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-3)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  💡 <strong>የይለፍ ቃል አልባ ምዝገባ፡</strong> ተማሪዎች በራስ-ሰር በሚመነጨው <strong>የተማሪ መታወቂያ</strong> እና <strong>በመጀመሪያ ስማቸው</strong> ይገባሉ።
                </div>

                {error && (
                  <div className="alert alert-error">
                    <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{error}</pre>
                  </div>
                )}
                {success && <div className="alert alert-success">{success}</div>}

                {/* Photo Upload / Preview Section */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ margin: 0 }}>የተማሪ ፎቶ</label>
                    <span className="badge badge-secondary" style={{ fontSize: '11px' }}>አማራጭ (Optional)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <StudentAvatar
                      photoUrl={createForm.photo_url}
                      name={`${createForm.first_name} ${createForm.last_name}`}
                      size="lg"
                    />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <label className="btn btn-secondary" style={{ cursor: 'pointer', textAlign: 'center', fontSize: 'var(--font-size-xs)' }}>
                        {uploadingPhoto ? '⏳ በመጫን ላይ...' : '📁 ፎቶ ይጫኑ (Upload)'}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handlePhotoUpload(e.target.files?.[0], false)}
                          disabled={uploadingPhoto}
                        />
                      </label>
                      <input
                        className="form-input"
                        name="photo_url"
                        placeholder="ወይም የፎቶ ሊንክ ያስገቡ (አማራጭ)"
                        value={createForm.photo_url}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, photo_url: e.target.value }))}
                        style={{ fontSize: 'var(--font-size-xs)' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">የመጀመሪያ ስም (የተማሪ መግቢያ ቁልፍ) *</label>
                    <input
                      className="form-input"
                      name="first_name"
                      placeholder="ለምሳሌ፡ Nuhamin"
                      value={createForm.first_name}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, first_name: e.target.value }))}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">የአባት ስም *</label>
                    <input
                      className="form-input"
                      name="last_name"
                      placeholder="ለምሳሌ፡ Abraham"
                      value={createForm.last_name}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, last_name: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">የተጠቃሚ ስም (አማራጭ — ካልሞላ በራስ-ሰር ይሰራል)</label>
                  <input
                    className="form-input"
                    name="username"
                    placeholder="ለምሳሌ፡ nuhamin.abraham"
                    value={createForm.username}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, username: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ኢሜይል (አማራጭ)</label>
                  <input
                    className="form-input"
                    type="email"
                    name="email"
                    placeholder="student@example.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  ይቅር
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploadingPhoto}>
                  {uploadingPhoto ? 'በመጫን ላይ...' : 'ተማሪውን መዝግብ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
