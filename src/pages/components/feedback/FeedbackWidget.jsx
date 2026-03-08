// src/pages/components/feedback/FeedbackWidget.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { buildApiUrl } from '../../../lib/api';
import './FeedbackWidget.css';

const MAX_COMMENT = 500;
const LONG_PRESS_MS = 400;
const FAB_SIZE = 44;
const EDGE_MARGIN = 12;
const STORAGE_KEY = 'gmg_feedback_draft';

const STARS = [1, 2, 3, 4, 5];

// ── localStorage helpers ──
function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { rating: 0, comment: '' };
    const parsed = JSON.parse(raw);
    return {
      rating: typeof parsed.rating === 'number' ? parsed.rating : 0,
      comment: typeof parsed.comment === 'string' ? parsed.comment : '',
    };
  } catch {
    return { rating: 0, comment: '' };
  }
}

function saveDraft(rating, comment) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ rating, comment }));
  } catch {
    // quota exceeded 등 무시
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 무시
  }
}

export default function FeedbackWidget() {
  const location = useLocation();

  // ───── FAB position (default: right side, upper area) ─────
  const [pos, setPos] = useState(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 400;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
      x: vw - FAB_SIZE - EDGE_MARGIN,
      y: Math.min(140, vh - FAB_SIZE - EDGE_MARGIN),
    };
  });

  // ───── Drag state ─────
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const longPressTimer = useRef(null);
  const dragStartRef = useRef({ px: 0, py: 0, ox: 0, oy: 0 });
  const didDrag = useRef(false);
  const fabRef = useRef(null);

  // ───── Modal state ─────
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [rating, setRating] = useState(() => loadDraft().rating);
  const [comment, setComment] = useState(() => loadDraft().comment);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Save draft to localStorage whenever rating/comment changes ──
  useEffect(() => {
    if (!submitted) {
      saveDraft(rating, comment);
    }
  }, [rating, comment, submitted]);

  // ── Compute modal origin based on FAB position ──
  const getModalOrigin = () => {
    const fabCenterX = pos.x + FAB_SIZE / 2;
    const fabCenterY = pos.y + FAB_SIZE / 2;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 400;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    // percentage from center of viewport
    const ox = ((fabCenterX / vw) * 100).toFixed(0);
    const oy = ((fabCenterY / vh) * 100).toFixed(0);
    return { transformOrigin: `${ox}% ${oy}%` };
  };

  // ── Snap to nearest edge ──
  const snapToEdge = useCallback((cx, cy) => {
    setIsSnapping(true);
    const vw = window.innerWidth;
    const leftX = EDGE_MARGIN;
    const rightX = vw - FAB_SIZE - EDGE_MARGIN;
    const midX = vw / 2;
    const snapX = cx + FAB_SIZE / 2 < midX ? leftX : rightX;
    const snapY = Math.max(EDGE_MARGIN, Math.min(cy, window.innerHeight - FAB_SIZE - EDGE_MARGIN));
    setPos({ x: snapX, y: snapY });
    setTimeout(() => setIsSnapping(false), 320);
  }, []);

  // ── Pointer handlers ──
  const handlePointerDown = useCallback(
    (e) => {
      if (isOpen) return;
      didDrag.current = false;

      dragStartRef.current = {
        px: e.clientX,
        py: e.clientY,
        ox: pos.x,
        oy: pos.y,
      };

      longPressTimer.current = setTimeout(() => {
        setIsDragging(true);
        didDrag.current = true;
        if (fabRef.current) fabRef.current.setPointerCapture(e.pointerId);
      }, LONG_PRESS_MS);
    },
    [isOpen, pos.x, pos.y],
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDragging) {
        const { px, py } = dragStartRef.current;
        if (Math.abs(e.clientX - px) > 5 || Math.abs(e.clientY - py) > 5) {
          clearTimeout(longPressTimer.current);
        }
        return;
      }
      const dx = e.clientX - dragStartRef.current.px;
      const dy = e.clientY - dragStartRef.current.py;
      setPos({
        x: dragStartRef.current.ox + dx,
        y: dragStartRef.current.oy + dy,
      });
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(() => {
    clearTimeout(longPressTimer.current);
    if (isDragging) {
      setIsDragging(false);
      snapToEdge(pos.x, pos.y);
    } else if (!didDrag.current) {
      setIsOpen(true);
    }
  }, [isDragging, pos.x, pos.y, snapToEdge]);

  // ── Window resize ──
  useEffect(() => {
    const handleResize = () => {
      setPos((prev) => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        return {
          x: Math.min(prev.x, vw - FAB_SIZE - EDGE_MARGIN),
          y: Math.min(prev.y, vh - FAB_SIZE - EDGE_MARGIN),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Submit ──
  const handleSubmit = async () => {
    if (rating === 0 || submitting) return;
    setSubmitting(true);

    try {
      await fetch(buildApiUrl('/api/feedback'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
          page: location.pathname + location.search,
        }),
      });
    } catch {
      // fire-and-forget
    }

    setSubmitting(false);
    setSubmitted(true);
    clearDraft();

    setTimeout(() => {
      animateClose(() => {
        setRating(0);
        setComment('');
        setSubmitted(false);
      });
    }, 1600);
  };

  // ── Close with animation ──
  const animateClose = (afterClose) => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      if (afterClose) afterClose();
    }, 250);
  };

  const handleClose = () => {
    // 닫아도 draft는 유지 (localStorage에 이미 저장되어 있음)
    animateClose();
  };

  // ───── FAB classes ─────
  const fabClassName = ['feedback-fab', isDragging ? 'dragging' : '', isSnapping ? 'snapping' : '']
    .filter(Boolean)
    .join(' ');

  const overlayClassName = ['feedback-overlay', isClosing ? 'feedback-overlay--closing' : '']
    .filter(Boolean)
    .join(' ');

  const modalClassName = ['feedback-modal', isClosing ? 'feedback-modal--closing' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {/* ── Floating Action Button ── */}
      <button
        ref={fabRef}
        type="button"
        className={fabClassName}
        style={{ left: pos.x, top: pos.y }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        aria-label="서비스 피드백"
        id="feedback-fab"
      >
        💬
      </button>

      {/* ── Modal ── */}
      {isOpen && (
        <div
          className={overlayClassName}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className={modalClassName} style={getModalOrigin()}>
            {submitted ? (
              <div className="feedback-success">
                <div className="feedback-success-icon">🎉</div>
                <p className="feedback-success-title">감사합니다!</p>
                <p className="feedback-success-sub">소중한 의견이 전달되었습니다.</p>
              </div>
            ) : (
              <>
                <div className="feedback-modal-header">
                  <h2 className="feedback-modal-title">서비스 피드백</h2>
                  <button
                    type="button"
                    className="feedback-close-btn"
                    onClick={handleClose}
                    aria-label="닫기"
                    id="feedback-close-btn"
                  >
                    ✕
                  </button>
                </div>

                <p className="feedback-question">가면가 서비스는 어떠셨나요?</p>
                <p className="feedback-sub">서비스 개선을 위해 평가해주세요</p>

                <div className="feedback-stars">
                  {STARS.map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`feedback-star ${star <= rating ? 'feedback-star--active' : ''}`}
                      onClick={() => setRating(star)}
                      aria-label={`${star}점`}
                      id={`feedback-star-${star}`}
                    >
                      <svg
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 2.5c.4 0 .7.2.9.6l2.3 4.7 5.2.8c.4.1.7.3.8.7.1.4 0 .7-.3 1l-3.8 3.7.9 5.1c.1.4-.1.8-.4 1-.3.2-.7.3-1 .1L12 17.8l-4.6 2.4c-.4.2-.8.1-1-.1-.3-.2-.5-.6-.4-1l.9-5.1L3.1 10.3c-.3-.3-.4-.6-.3-1 .1-.4.4-.6.8-.7l5.2-.8 2.3-4.7c.2-.4.5-.6.9-.6z"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  ))}
                </div>

                <p className="feedback-comment-label">의견을 남겨주세요</p>
                <textarea
                  className="feedback-textarea"
                  placeholder="가면가 서비스를 이용하면서 불편했던 점이나 개선이 필요한 부분을 알려주세요!"
                  maxLength={MAX_COMMENT}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  id="feedback-textarea"
                />
                <p className="feedback-char-count">
                  {comment.length} / {MAX_COMMENT}
                </p>

                <button
                  type="button"
                  className="feedback-submit"
                  onClick={handleSubmit}
                  disabled={rating === 0 || submitting}
                  id="feedback-submit-btn"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M22 2L11 13" />
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                  </svg>
                  의견 보내기
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
