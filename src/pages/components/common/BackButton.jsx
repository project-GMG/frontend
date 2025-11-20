// src/components/common/BackButton.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BackButton.css';

export default function BackButton({ onClick }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) return onClick();
    navigate(-1); 
  };

  return (
    <button
      type="button"
      className="back-button"
      onClick={handleClick}
    >
      <svg
        className="back-icon"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M15 6L9 12L15 18"
          stroke="var(--text-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
