'use client';

import * as React from 'react';
import { AlarmCircle, Check, X } from 'lucide-react';

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000; // 1 million seconds essentially means they don't auto-remove

type ToasterToast = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'success';
};

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type Action =
  | {
      type: typeof actionTypes.ADD_TOAST;
      payload: ToasterToast;
    }
  | {
      type: typeof actionTypes.UPDATE_TOAST;
      payload: Partial<ToasterToast>;
    }
  | {
      type: typeof actionTypes.DISMISS_TOAST;
      payload: { id: string };
    }
  | {
      type: typeof actionTypes.REMOVE_TOAST;
      payload: { id: string };
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    store.dispatch({
      type: actionTypes.REMOVE_TOAST,
      payload: { id: toastId },
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.payload, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
      };

    case actionTypes.DISMISS_TOAST: {
      const { id } = action.payload;

      // Clear the timeout for this toast
      if (toastTimeouts.has(id)) {
        clearTimeout(toastTimeouts.get(id)!);
        toastTimeouts.delete(id);
      }

      return {
        ...state,
        toasts: state.toasts.map(t =>
          t.id === id ? { ...t, open: false } : t
        ),
      };
    }
    case actionTypes.REMOVE_TOAST:
      if (action.payload.id === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter(t => t.id !== action.payload.id),
      };
  }
};

interface Props {
  children?: React.ReactNode;
}

const initState = (): State => {
  return {
    toasts: [],
  };
};

const [
  { Provider: ToastProvider, useState: useToastState },
  dispatch,
] = (() => {
  const [dispatch, state] = React.useReducer(reducer, initState());
  return [{ Provider: ToastProvider, useState: useToastState }, dispatch];
})();

function Toast({
  title,
  description,
  action,
  variant = 'default',
  ...props
}: ToasterToast & Props) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'destructive':
        return 'bg-destructive text-destructive-foreground';
      case 'success':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-primary text-primary-foreground';
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`
        flex w-full items-center space-x-4 rounded-border border p-4
        ${getVariantClasses()}
        `}
      {...props}
    >
      {action ? (
        <>
          {action}
          <div className="flex flex-col space-y-2">
            {title && (
              <h3 className="text-sm font-semibold">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs">
                {description}
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col space-y-2">
          {title && (
            <h3 className="text-sm font-semibold">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-xs">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export const useToast = () => {
  const { toasts } = useToastState();

  const toast = ({
    title,
    description,
    action,
    variant = 'default',
  }: Omit<ToasterToast, 'id'>) => {
    const id = genId();

    const update = (props: ToasterToast) =>
      dispatch({
        type: actionTypes.UPDATE_TOAST,
        payload: { ...props, id },
      });

    const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, payload: { id } });

    dispatch({
      type: actionTypes.ADD_TOAST,
      payload: {
        id,
        title,
        description,
        action,
        variant,
      },
    });

    return {
      id: id,
      dismiss,
      update,
    };
  };

  return {
    toast,
    toasts: toasts.map(t => ({
      ...t,
      // @ts-ignore
      onOpenChange: (open: boolean) => {
        if (!open) dispatch({ type: actionTypes.DISMISS_TOAST, payload: { id: t.id } });
      },
    })),
  };
};

export { ToastProvider, useToast, toast };