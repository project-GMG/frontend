import React, { useState } from 'react';
import './CreateInfoPage.css';
import BackButton from '../components/common/BackButton';
import TopBar from '../components/common/TopBar';
import NextButton from '../components/common/NextButton';
import { useNavigate } from 'react-router-dom';


const DEFAULT_NAME = '전북대에서 밥먹자';
const DEFAULT_PASSWORD = '0000';

export default function CreateInfoPage() {
    const navigate = useNavigate();
  const [groupName, setGroupName] = useState(DEFAULT_NAME);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);

  const [nameTouched, setNameTouched] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const [passwordTouched, setPasswordTouched] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

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

  const handlePasswordFocus = () => {
    setPasswordTouched(true);
    setPasswordFocused(true);
  };

  const handlePasswordBlur = () => {
    setPasswordFocused(false);
  };

  const handleNameChange = (e) => {
    setGroupName(e.target.value);
  };

  const handlePasswordChange = (e) => {
    const onlyDigits = e.target.value.replace(/\D/g, '');
    setPassword(onlyDigits);
  };

  // 유효성 검사
  const isNameTooLong = groupName.length > 12;
  const isNameValid = groupName.length > 0 && !isNameTooLong;

  const isPasswordTooLong = password.length > 4;
  const isPasswordValid = /^\d{4}$/.test(password);

  const isFormValid =
    isNameValid && isPasswordValid && !isNameTooLong && !isPasswordTooLong;

  const handleCreate = () => {
    if (!isFormValid) return;

    console.log('모임 이름:', groupName);
    console.log('비밀번호:', password);

    navigate('/create/final');
  };

const nameUnderlineClass =
  'info-input-wrapper' +
  (isNameTooLong ? ' info-input-wrapper--active' : '');

const passwordUnderlineClass =
  'info-input-wrapper' +
  (isPasswordTooLong ? ' info-input-wrapper--active' : '');


  const nameLabelClass =
    'info-field-label' + (isNameTooLong ? ' info-field-label--error' : '');

  const passwordLabelClass =
    'info-field-label' + (isPasswordTooLong ? ' info-field-label--error' : '');

  const nameInputClass =
    'info-input' +
    (!nameTouched && groupName === DEFAULT_NAME
      ? ' info-input--placeholder'
      : '');

  const passwordInputClass =
    'info-input' +
    (!passwordTouched && password === DEFAULT_PASSWORD
      ? ' info-input--placeholder'
      : '');

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
            </div>
            {isNameTooLong && (
              <p className="info-error-text">12글자 이내로 입력해주세요</p>
            )}
          </section>

          {/* 모임장 비밀번호 */}
          <section className="info-field">
            <label className={passwordLabelClass}>모임장 비밀번호</label>
            <div className={passwordUnderlineClass}>
              <input
                type="tel"
                inputMode="numeric"
                className={passwordInputClass}
                value={password}
                onFocus={handlePasswordFocus}
                onBlur={handlePasswordBlur}
                onChange={handlePasswordChange}
              />
            </div>
            {isPasswordTooLong && (
              <p className="info-error-text">4글자로 입력해주세요</p>
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
