import { useEffect, useState } from 'react';

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

let count = 0;
let memoryState = { toasts: [] };
const listeners = new Set();
const removalTimers = new Map();
const autoDismissTimers = new Map();

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return String(count);
}

function emit(nextState) {
  memoryState = nextState;
  listeners.forEach((listener) => listener(memoryState));
}

function dismissToast(toastId) {
  if (toastId == null) {
    memoryState.toasts.forEach((toastItem) => dismissToast(toastItem.id));
    return;
  }

  const toast = memoryState.toasts.find((item) => item.id === toastId);
  if (!toast) return;

  const autoDismissTimer = autoDismissTimers.get(toastId);
  if (autoDismissTimer) {
    clearTimeout(autoDismissTimer);
    autoDismissTimers.delete(toastId);
  }

  emit({
    toasts: memoryState.toasts.map((item) => (item.id === toastId ? { ...item, open: false } : item)),
  });

  if (removalTimers.has(toastId)) return;
  const timer = setTimeout(() => {
    removalTimers.delete(toastId);
    emit({ toasts: memoryState.toasts.filter((item) => item.id !== toastId) });
  }, TOAST_REMOVE_DELAY);
  removalTimers.set(toastId, timer);
}

export function toast({ title, description, variant = 'default', duration = TOAST_REMOVE_DELAY, ...props }) {
  const id = genId();
  const dismiss = () => dismissToast(id);
  const update = (nextProps) => {
    emit({
      toasts: memoryState.toasts.map((item) => (item.id === id ? { ...item, ...nextProps } : item)),
    });
  };

  emit({
    toasts: [
      {
        ...props,
        id,
        title,
        description,
        variant,
        open: true,
        onOpenChange: (open) => {
          if (!open) dismiss();
        },
      },
      ...memoryState.toasts.filter((item) => item.id !== id),
    ].slice(0, TOAST_LIMIT),
  });

  if (duration !== Infinity) {
    autoDismissTimers.set(id, setTimeout(dismiss, duration));
  }

  return { id, dismiss, update };
}

export function useToast() {
  const [state, setState] = useState(memoryState);

  useEffect(() => {
    listeners.add(setState);
    return () => listeners.delete(setState);
  }, []);

  return {
    ...state,
    dismiss: dismissToast,
    toast,
  };
}

export { TOAST_LIMIT, TOAST_REMOVE_DELAY };
