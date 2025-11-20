// src/components/common/NextButton.jsx
import React from 'react';
import './NextButton.css';

export default function NextButton({ label = '다음', onClick, disabled = false }) {
  return (
    <div className="next-button-wrapper">
      <button
        className="next-button"
        onClick={onClick}
        disabled={disabled}
        type="button"
      >
        {label}
      </button>
    </div>
  );
}
