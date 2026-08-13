import React from "react";

import { Slot } from '@radix-ui/react-slot'

import { cn} from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Change the default rendered element for the one passed as a child, merging their props and behavior.
   * @defaultValue input
   */
  asChild?: boolean
}

const Input = React.forwardRef<
  HTMLInputElement,
  InputProps
>(({
  asChild = false,
  className,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : 'input'
  return (
    <Comp
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }