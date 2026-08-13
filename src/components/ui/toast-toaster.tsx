import React from "react";
'use client';

import { useToast } from '@/components/ui/toast';

interface ToastToasterProps {
  className?: string;
}

export const ToastToaster = React.forwardRef<
  HTMLDivElement,
  ToastToasterProps
>(({ className, ...props }, ref) => {
  const { toast } = useToast();

  // This component is just a provider for the toast hook
  // The actual toast rendering happens in the useToast hook's return value
  return null;
});
ToastToaster.displayName = 'ToastToaster';