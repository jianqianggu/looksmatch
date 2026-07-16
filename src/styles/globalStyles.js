/**
 * Global styles for the Looksmatch app
 */
export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');
  
  .display {
    font-family: 'Bebas Neue', sans-serif;
    letter-spacing: 0.03em;
  }
  
  .mono {
    font-family: 'IBM Plex Mono', monospace;
  }
  
  @keyframes stampIn {
    0% {
      transform: scale(2.2) rotate(-8deg);
      opacity: 0;
    }
    60% {
      transform: scale(0.95) rotate(-8deg);
      opacity: 1;
    }
    100% {
      transform: scale(1) rotate(-8deg);
      opacity: 1;
    }
  }
  
  .stamp-anim {
    animation: stampIn 0.5s cubic-bezier(.2, 1.4, .4, 1) forwards;
  }
  
  .vote-btn {
    transition: transform 0.15s ease, opacity 0.15s ease;
  }
  
  .vote-btn:hover {
    transform: translateY(-2px);
  }
  
  .vote-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    transform: none;
  }
  
  .vote-btn:focus-visible {
    outline: 2px solid #F2B84B;
    outline-offset: 2px;
  }
  
  .icon-btn {
    transition: transform 0.15s ease;
  }
  
  .icon-btn:hover {
    transform: scale(1.08);
  }
  
  .icon-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    transform: none;
  }
  
  .card-flash {
    transition: opacity 0.15s ease;
  }
  
  .field input,
  .field textarea {
    width: 100%;
    background: #1A1C23;
    border: 1px solid #2A2D37;
    color: #F2F1ED;
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 14px;
    font-family: 'Inter', sans-serif;
    box-sizing: border-box;
  }
  
  .field input:focus,
  .field textarea:focus {
    outline: 2px solid #F2B84B;
    outline-offset: 1px;
  }
  
  .tab-btn {
    transition: color 0.15s ease, border-color 0.15s ease;
  }
  
  .tab-btn:disabled {
    color: #45474F !important;
    cursor: not-allowed;
  }
`;
