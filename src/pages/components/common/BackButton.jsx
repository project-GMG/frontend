import React from 'react';
import './BackButton.css';

export default function BackButton({ onClick }) {
  return (
    <button
      type="button"
      className="back-button"
      onClick={onClick}
      aria-label="뒤로가기"
    >
      <span className="back-button-icon" />
    </button>
  );
}
