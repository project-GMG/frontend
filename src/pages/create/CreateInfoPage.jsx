import React, { useState } from 'react';
import './CreateInfoPage.css';
import BackButton from '../components/common/BackButton';
import TopBar from '../components/common/TopBar';
import NextButton from '../components/common/NextButton';
import { useNavigate } from 'react-router-dom';
import editPen from '../../assets/icons/edit_pen.png';


const DEFAULT_NAME = '전북대에서 밥먹자';

export default function CreateInfoPage() {
  const navigate = useNavigate();

  const [groupName, setGroupName] = useState(DEFAULT_NAME);
  const [nameTouched, setNameTouched] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const handleBack = () => {
    window.history.back();
  };

  const handleNameFocus = () => {
    setNameTouched(true);
    setNameFocused(true);
  };

  const handleNameBlur = () => {
    setNameFocused(false);
  };

  const handleNameChange = (e) => {
    setGroupName(e.target.value);
  };

  // 유효성 검사 (이름만)
  const isNameTooLong = groupName.length > 12;
  const isNameValid = groupName.length > 0 && !isNameTooLong;
  const isFormValid = isNameValid && !isNameTooLong;

  const handleCreate = () => {
    if (!isFormValid) return;

    console.log('모임 이름:', groupName);
    navigate('/create/final');
  };

  const nameUnderlineClass =
    'info-input-wrapper' + (isNameTooLong ? ' info-input-wrapper--active' : '');

  const nameLabelClass =
    'info-field-label' + (isNameTooLong ? ' info-field-label--error' : '');

  const nameInputClass =
    'info-input' +
    (!nameTouched && groupName === DEFAULT_NAME ? ' info-input--placeholder' : '');

  return (
    <div className="create-info-page">
      <div className="create-info-container">
        <TopBar currentStep={4} totalSteps={4} />

        <header className="create-info-header">
          <BackButton onClick={handleBack} />
        </header>

        <main className="create-info-content">
          <h1 className="create-info-title">모임을 생성하세요</h1>

          {/* 모임 이름 */}
          <section className="info-field">
            <label className={nameLabelClass}>모임 이름</label>

            <div className={nameUnderlineClass}>
              <input
                type="text"
                className={nameInputClass}
                value={groupName}
                onFocus={handleNameFocus}
                onBlur={handleNameBlur}
                onChange={handleNameChange}
              />

   
                  <img
                    src={editPen}
                    alt="수정"
                    className="info-pencil"
                  />
            </div>

            {isNameTooLong && (
              <p className="info-error-text">12글자 이내로 입력해주세요</p>
            )}
          </section>
        </main>

        <footer className="create-info-footer">
          <NextButton disabled={!isFormValid} onClick={handleCreate}>
            생성하기
          </NextButton>
        </footer>
      </div>
    </div>
  );
}
