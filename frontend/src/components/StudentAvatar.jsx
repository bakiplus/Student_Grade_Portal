/**
 * StudentAvatar component — displays custom student photo if present,
 * otherwise renders a clean blank / initials placeholder (no cartoon avatars).
 */

export default function StudentAvatar({
  student,
  photoUrl,
  name,
  size = 'md', // 'sm' (32px), 'md' (44px), 'lg' (72px), 'xl' (110px)
  className = '',
  onClick,
}) {
  const src = photoUrl || student?.photo_url;
  const isCustomPhoto = Boolean(src && !src.includes('dicebear') && !src.includes('undefined'));
  const displayName = name || (student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : '');
  const initial = displayName ? displayName[0].toUpperCase() : (student?.first_name?.[0]?.toUpperCase() || '');

  const sizeStyles = {
    sm: { width: '32px', height: '32px', fontSize: '13px' },
    md: { width: '44px', height: '44px', fontSize: '16px' },
    lg: { width: '72px', height: '72px', fontSize: '24px' },
    xl: { width: '110px', height: '110px', fontSize: '36px' },
  }[size] || { width: '44px', height: '44px', fontSize: '16px' };

  if (isCustomPhoto) {
    return (
      <div
        className={`student-avatar-wrap ${className}`}
        style={{
          ...sizeStyles,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          border: '2px solid var(--accent-primary)',
          boxShadow: 'var(--shadow-sm)',
          cursor: onClick ? 'pointer' : 'default',
        }}
        onClick={onClick}
      >
        <img
          src={src}
          alt={displayName || 'Student Photo'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Blank placeholder state (no image uploaded)
  return (
    <div
      className={`student-avatar-blank ${className}`}
      style={{
        ...sizeStyles,
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        border: '1.5px dashed rgba(255, 255, 255, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontWeight: 600,
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      onClick={onClick}
      title={onClick ? 'ፎቶ ለመጫን ይጫኑ (Click to upload photo)' : displayName}
    >
      {initial || '👤'}
    </div>
  );
}
