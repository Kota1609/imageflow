import { CheckCircleIcon, XCircleIcon, InfoCircleIcon, XMarkIcon } from './Icons';
import type { Toast as ToastData } from '../types';

interface ToastContainerProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
}

function getToastIcon(type: ToastData['type']): React.JSX.Element {
  switch (type) {
    case 'success':
      return <CheckCircleIcon size={18} />;
    case 'error':
      return <XCircleIcon size={18} />;
    case 'info':
      return <InfoCircleIcon size={18} />;
  }
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps): React.JSX.Element | null {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          <span className="toast__icon">{getToastIcon(toast.type)}</span>
          <span className="toast__message">{toast.message}</span>
          <button
            className="toast__close"
            onClick={() => onRemove(toast.id)}
            aria-label="Dismiss notification"
          >
            <XMarkIcon size={14} />
          </button>
          <div className="toast__progress" />
        </div>
      ))}
    </div>
  );
}
