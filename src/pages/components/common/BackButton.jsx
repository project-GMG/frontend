// gmg-front/src/pages/components/common/BackButton.jsx

import React from 'react';
import './BackButton.css';
import NavigationIcon from '../../../assets/icons/category_icon/Navigation.svg';

export default function BackButton({ onClick }) {
  return (
    <button
      type="button"
      className="back-button"
      onClick={onClick}
      aria-label="뒤로가기"
    >
      <img
        src={NavigationIcon}
        alt=""
        className="back-button-icon"
      />
    </button>
  );
}
