/**
 * ManageStudents — for instructors to register, view, search, and upload/manage student photos with optional state.
 */

import { useState } from 'react';
import api from '../../api/client';

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
      const res = await api.get('/auth/students/');
      setStudents(res.data.results || res.data);
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
      setError(err.response?.data?.detail || 'Failed to upload photo to Cloudinary.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (student) => {
    setError('');
    setSuccess('');
    setEditingStudent(student);
    setEditForm({
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      photo_url: student.photo_url || '',
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
      setSuccess(`Updated photo & profile for ${updatedStudent.first_name} ${updatedStudent.last_name}!`);
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
        setError('Failed to update student photo.');
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
        `Student created successfully! Student ID: ${res.data.student_id} | Login Key: First Name "${res.data.first_name}".`
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
        setError('Failed to create student.');
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
          <h1 className="page-title">Manage Students</h1>
          <p className="page-subtitle">
            Upload & manage optional student photos, view student IDs, and maintain passwordless student records ({students.length} Total)
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
            ➕ Register New Student
          </button>
        </div>
      </div>

      {/* Search Bar & Controls */}
      <div style={{ marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            className="form-input"
            type="text"
            placeholder="🔍 Search students by name, Student ID (e.g. STU-260001), or username..."
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
            Clear Search
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
            {students.length === 0 ? 'No students yet' : 'No students matching search'}
          </div>
          <div className="empty-state-text">
            {students.length === 0
              ? 'Register students to assign courses and enter grades.'
              : `No results found for "${searchQuery}". Try a different name or ID.`}
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '64px' }}>Photo</th>
                <th>Student ID</th>
                <th>Full Name</th>
                <th>Login First Name</th>
                <th>Photo Status</th>
                <th>Username</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s) => {
                const hasCustomPhoto = Boolean(s.photo_url && !s.photo_url.includes('dicebear'));
                const photoSrc =
                  s.photo_url ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.first_name}${s.last_name}`;

                return (
                  <tr key={s.id}>
                    <td>
                      <div
                        onClick={() => openEditModal(s)}
                        title="Click to change photo"
                        style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}
                      >
                        <img
                          src={photoSrc}
                          alt={s.first_name}
                          className="student-table-avatar"
                          style={{
                            border: hasCustomPhoto ? '2px solid var(--accent-primary)' : '2px dashed var(--border-subtle)',
                            transition: 'transform 0.2s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
                          onError={(e) => {
                            e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.first_name}`;
                          }}
                        />
                      </div>
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
                          📷 Custom Photo
                        </span>
                      ) : (
                        <span className="badge badge-secondary" style={{ fontSize: '11px', opacity: 0.8 }}>
                          🎭 Avatar (Optional)
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
                        📸 {hasCustomPhoto ? 'Change Photo' : 'Upload Photo'}
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
                📸 Student Photo & Profile — {editingStudent.first_name} {editingStudent.last_name}
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
                  <div
                    style={{
                      width: '110px',
                      height: '110px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: editForm.photo_url ? '3px solid var(--accent-primary)' : '3px dashed var(--border-subtle)',
                      boxShadow: 'var(--shadow-md)',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={
                        editForm.photo_url ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${editForm.first_name}${editForm.last_name}`
                      }
                      alt="Student Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${editForm.first_name}`;
                      }}
                    />
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {editForm.first_name} {editForm.last_name}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                      ID: <span className="badge badge-info">{editingStudent.student_id}</span> • Login Key:{' '}
                      <span className="badge badge-success">{editForm.first_name}</span>
                    </div>
                  </div>

                  {/* Photo Actions */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', justifyContent: 'center', width: '100%' }}>
                    <label className="btn btn-primary" style={{ cursor: 'pointer', fontSize: 'var(--font-size-xs)' }}>
                      {uploadingPhoto ? '⏳ Uploading...' : '📁 Upload Photo (Cloudinary)'}
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
                        🗑️ Reset to Default Avatar
                      </button>
                    )}
                  </div>

                  {/* Optional URL input */}
                  <div style={{ width: '100%' }}>
                    <input
                      className="form-input"
                      placeholder="Or paste image URL (Cloudinary / CDN)"
                      value={editForm.photo_url}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, photo_url: e.target.value }))}
                      style={{ fontSize: 'var(--font-size-xs)' }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px', textAlign: 'center' }}>
                      💡 Photo is <strong>optional</strong>. If left blank, a generated avatar is used automatically.
                    </span>
                  </div>
                </div>

                {/* Edit Names & Email */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name (Student's Login Key)</label>
                    <input
                      className="form-input"
                      value={editForm.first_name}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, first_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input
                      className="form-input"
                      value={editForm.last_name}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, last_name: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
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
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploadingPhoto || savingEdit}>
                  {savingEdit ? 'Saving...' : '💾 Save Photo & Details'}
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
              <div className="modal-title">Register New Student</div>
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
                  💡 <strong>Passwordless Flow:</strong> Students log in using their auto-generated{' '}
                  <strong>Student ID</strong> and their <strong>First Name</strong>.
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
                    <label className="form-label" style={{ margin: 0 }}>Student Photo</label>
                    <span className="badge badge-secondary" style={{ fontSize: '11px' }}>Optional</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <div className="photo-preview-circle">
                      <img
                        src={
                          createForm.photo_url ||
                          (createForm.first_name
                            ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${createForm.first_name}`
                            : 'https://api.dicebear.com/7.x/avataaars/svg?seed=new')
                        }
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      <label className="btn btn-secondary" style={{ cursor: 'pointer', textAlign: 'center', fontSize: 'var(--font-size-xs)' }}>
                        {uploadingPhoto ? '⏳ Uploading to Cloudinary...' : '📁 Upload Photo (Cloudinary)'}
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
                        placeholder="Or paste image URL (Optional)"
                        value={createForm.photo_url}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, photo_url: e.target.value }))}
                        style={{ fontSize: 'var(--font-size-xs)' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name * (Student's Login Key)</label>
                    <input
                      className="form-input"
                      name="first_name"
                      placeholder="e.g. Maya"
                      value={createForm.first_name}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, first_name: e.target.value }))}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <input
                      className="form-input"
                      name="last_name"
                      placeholder="e.g. Lin"
                      value={createForm.last_name}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, last_name: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Username (Optional — auto-generated if left blank)</label>
                  <input
                    className="form-input"
                    name="username"
                    placeholder="e.g. maya.lin"
                    value={createForm.username}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, username: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
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
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploadingPhoto}>
                  {uploadingPhoto ? 'Uploading Photo...' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
