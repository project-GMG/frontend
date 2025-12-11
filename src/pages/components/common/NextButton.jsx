import React from 'react';
import './NextButton.css';

export default function NextButton({ disabled, onClick, children }) {
  const handleClick = (event) => {
    if (disabled) return;
    if (onClick) onClick(event);
  };

  return (
    <button
      type="button"
      className={
        'next-button ' +
        (disabled ? 'next-button--disabled' : 'next-button--enabled')
      }
      disabled={disabled}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
