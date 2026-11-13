import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const AUTO_CLOSE_MS = 2000; // 2 seconds for success messages

const MessagePopup = ({
  open,
  title = "Access Message",
  message,
  type, // 'success' | 'error' | 'info'
  onClose,
  actions = [],
}) => {
  const okButtonRef = useRef(null);
  const timerRef = useRef(null);
  const [progress, setProgress] = useState(100);
  const isSuccess = 
    type === "success" || 
    title?.toLowerCase().includes("success") || 
    message?.toLowerCase().includes("successfully");

  useEffect(() => {
    if (open && okButtonRef.current) {
      setTimeout(() => okButtonRef.current?.focus(), 50);
    }
  }, [open, message]);

  // Auto-close + progress bar for success messages
  useEffect(() => {
    if (!open || !isSuccess) return;

    setProgress(100);
    const step = 100 / (AUTO_CLOSE_MS / 50); // update every 50ms
    let current = 100;

    const interval = setInterval(() => {
      current -= step;
      setProgress(Math.max(0, current));
    }, 50);

    timerRef.current = setTimeout(() => {
      clearInterval(interval);
      onClose?.();
    }, AUTO_CLOSE_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timerRef.current);
    };
  }, [open, isSuccess]);

  if (!open) return null;

  const headerColor = isSuccess
    ? "bg-emerald-600"
    : type === "error"
    ? "bg-red-600"
    : "bg-slate-700";

  const btnColor = isSuccess
    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
    : type === "error"
    ? "bg-red-600 hover:bg-red-700 shadow-red-500/20"
    : "bg-slate-700 hover:bg-slate-800 shadow-slate-700/20";

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 pointer-events-auto">
      <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden pointer-events-auto">
        {/* Header */}
        <div className={`${headerColor} px-4 py-3 text-white flex items-center gap-2`}>
          {isSuccess ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : type === "error" ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <h3 className="text-base font-semibold tracking-wide flex-1">{title}</h3>
          {isSuccess && (
            <span className="text-xs text-white/70">Auto-closing...</span>
          )}
        </div>

        {/* Auto-close progress bar (success only) */}
        {isSuccess && (
          <div className="w-full h-1 bg-emerald-100 dark:bg-emerald-900/30">
            <div
              className="h-1 bg-emerald-500 transition-all ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action buttons — support confirm actions or default OK */}
        {!isSuccess && (
          <div className="flex justify-center gap-3 px-4 pb-4">
            {actions.length > 0 ? (
              actions.map((action, index) => {
                const actionColor = action.variant === "secondary"
                  ? "bg-slate-500 hover:bg-slate-600 shadow-slate-500/20"
                  : btnColor;
                return (
                  <button
                    key={index}
                    ref={index === 0 ? okButtonRef : null}
                    type="button"
                    onClick={() => {
                      clearTimeout(timerRef.current);
                      action.onClick?.();
                    }}
                    className={`min-w-24 rounded-full ${actionColor} px-6 py-2 text-sm text-white font-semibold shadow-md active:scale-95 transition-all duration-200`}
                  >
                    {action.label}
                  </button>
                );
              })
            ) : (
              <button
                ref={okButtonRef}
                type="button"
                onClick={() => {
                  clearTimeout(timerRef.current);
                  onClose?.();
                }}
                className={`min-w-24 rounded-full ${btnColor} px-6 py-2 text-sm text-white font-semibold shadow-md active:scale-95 transition-all duration-200`}
              >
                OK
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default MessagePopup;
