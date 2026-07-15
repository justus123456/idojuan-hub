// src/hooks/use-toast.ts
import * as React from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 3; // max simultaneous toasts
const TOAST_REMOVE_DELAY = 5000; // auto-dismiss after 5s

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type Action =
  | { type: typeof actionTypes.ADD_TOAST; toast: ToasterToast }
  | { type: typeof actionTypes.UPDATE_TOAST; toast: Partial<ToasterToast> & { id: string } }
  | { type: typeof actionTypes.DISMISS_TOAST; toastId?: string }
  | { type: typeof actionTypes.REMOVE_TOAST; toastId?: string };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function addToRemoveQueue(toastId: string, dispatch: (a: Action) => void) {
  if (toastTimeouts.has(toastId)) return;

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: actionTypes.REMOVE_TOAST, toastId });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case actionTypes.DISMISS_TOAST: {
      const toastId = action.toastId;
      if (toastId) {
        addToRemoveQueue(toastId, dispatch);
      } else {
        state.toasts.forEach((t) => addToRemoveQueue(t.id, dispatch));
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          toastId ? (t.id === toastId ? { ...t, open: false } : t) : { ...t, open: false }
        ),
      };
    }

    case actionTypes.REMOVE_TOAST: {
      const toastId = action.toastId;
      if (toastId) {
        return {
          ...state,
          toasts: state.toasts.filter((t) => t.id !== toastId),
        };
      }
      return { ...state, toasts: [] };
    }

    default:
      return state;
  }
};

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

type ToastOptions = Omit<ToasterToast, "id">;

function toast({ ...props }: ToastOptions) {
  const id = genId();

  const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });
  const update = (updated: Partial<ToasterToast>) =>
    dispatch({ type: actionTypes.UPDATE_TOAST, toast: { ...updated, id } });

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      // push down to avoid navbar clash
      className: props.className ? `${props.className} mt-24` : "mt-24",
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return { id, dismiss, update };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  };
}

export { useToast, toast };
