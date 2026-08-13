import React from "react";

import { Slot } from '@radix-ui/react-slot'

import { cn} from '@/lib/utils'

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /**
   * Change the default rendered element for the one passed as a child, merging their props and behavior.
   * @defaultValue label
   */
  asChild?: boolean
}

const Label = React.forwardRef<
  HTMLLabelElement,
  LabelProps
>(({
  asChild = false,
  className,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : 'label'
  return (
    <Comp
      ref={ref}
      className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50', className)}
      {...props}
    />
  )
})
Label.displayName = 'Label'

export { Label }