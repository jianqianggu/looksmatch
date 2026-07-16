import React from 'react';
import { Lock } from 'lucide-react';
import { voteBtnStyle } from '../styles/buttonStyles';

/**
 * LockedState - Displays a locked feature with an explanation and CTA
 */
export function LockedState({ text, onGo, goLabel = 'Go to profile' }) {
  return (
    <div
      style={{
        background: '#1A1C23',
        border: '1px solid #2A2D37',
        borderRadius: 16,
        padding: 32,
        textAlign: 'center',
      }}
    >
      <Lock size={24} color="#565A66" style={{ marginBottom: 10 }} />
      <p style={{ color: '#8A8D99', fontSize: 14, margin: '0 0 18px' }}>{text}</p>
      <button onClick={onGo} className="vote-btn" style={{ ...voteBtnStyle('#F2B84B'), padding: '9px 18px' }}>
        {goLabel}
      </button>
    </div>
  );
}
