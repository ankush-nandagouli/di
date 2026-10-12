// Global Application Toast Utility for Success and Error feedback

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastPayload {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export function showToast(type: ToastType, message: string, title?: string, duration = 4000) {
  if (typeof window === 'undefined') return;
  const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const event = new CustomEvent<ToastPayload>('dakshyam-toast', {
    detail: { id, type, title, message, duration }
  });
  window.dispatchEvent(event);
}

export function notifySuccess(message: string, title?: string) {
  showToast('success', message, title || 'Success');
}

export function notifyError(message: string, title?: string) {
  showToast('error', message, title || 'Error');
}

export function notifyInfo(message: string, title?: string) {
  showToast('info', message, title || 'Information');
}

export function notifyWarning(message: string, title?: string) {
  showToast('warning', message, title || 'Notice');
}
