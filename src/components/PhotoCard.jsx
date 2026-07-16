import React from 'react';

/**
 * PhotoCard - Displays a candidate's photo, name, age, and tagline
 */
export function PhotoCard({ profile, large = false }) {
  return (
    <div style={{ flex: 1 }}>
      <div
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: 14,
          overflow: 'hidden',
          background: '#1A1C23',
        }}
      >
        <img
          src={profile.photo}
          alt={profile.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
      <p style={{ fontWeight: 600, margin: '10px 0 0', fontSize: large ? 18 : 15 }}>
        {profile.name}, {profile.age}
      </p>
      <p style={{ color: '#8A8D99', fontSize: large ? 13 : 12, margin: '2px 0 0' }}>
        {profile.tagline}
      </p>
    </div>
  );
}
