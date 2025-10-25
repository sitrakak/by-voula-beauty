import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const FeedbackContext = createContext(null);

export function FeedbackProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const timersRef = useRef(new Map());

  const removeMessage = useCallback((id) => {
    setMessages((prev) => prev.filter((message) => message.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showMessage = useCallback(
    ({ text, type = 'info', duration = 3500 }) => {
      if (!text) return null;
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      setMessages((prev) => [...prev, { id, text, type }]);
      if (duration > 0) {
        const timeout = setTimeout(() => removeMessage(id), duration);
        timersRef.current.set(id, timeout);
      }
      return id;
    },
    [removeMessage]
  );

  const showSuccess = useCallback((text, duration) => showMessage({ text, type: 'success', duration }), [showMessage]);
  const showError = useCallback((text, duration) => showMessage({ text, type: 'error', duration }), [showMessage]);
  const showInfo = useCallback((text, duration) => showMessage({ text, type: 'info', duration }), [showMessage]);

  const value = useMemo(
    () => ({
      showMessage,
      showSuccess,
      showError,
      showInfo,
      removeMessage
    }),
    [removeMessage, showError, showInfo, showMessage, showSuccess]
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {messages.map((message) => (
          <div key={message.id} className={`toast ${message.type}`} role="status">
            <span>{message.text}</span>
            <button type="button" aria-label="Fermer la notification" onClick={() => removeMessage(message.id)}>
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback doit \u00eatre utilis\u00e9 dans FeedbackProvider');
  }
  return context;
}
