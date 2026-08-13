import React from "react";
import { ReactNode } from 'react';

interface CardProps {
  className?: string;
  children: ReactNode;
}

export const Card = React.forwardRef<
  HTMLDivElement,
  CardProps
>(({ className, children }, ref) => (
  <div
    ref={ref}
    className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
    role="region"
  >
    <div className="p-6">{children}</div>
  </div>
));
Card.displayName = 'Card';

interface CardHeaderProps {
  className?: string;
  children: ReactNode;
}

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  CardHeaderProps
>(({ className, children }, ref) => (
  <div ref={ref} className={`flex flex-row space-y-4 p-6 ${className}`}>
    <div className="grid">
      <h3 className="text-lg font-semibold leading-none tracking-tight">{children}</h3>
    </div>
  </div>
));
CardHeader.displayName = 'CardHeader';

interface CardContentProps {
  className?: string;
  children: ReactNode;
}

export const CardContent = React.forwardRef<
  HTMLDivElement,
  CardContentProps
>(({ className, children }, ref) => (
  <div ref={ref} className={`p-6 pt-0 ${className}`}>{children}</div>
));
CardContent.displayName = 'CardContent';

interface CardFooterProps {
  className?: string;
  children: ReactNode;
}

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  CardFooterProps
>(({ className, children }, ref) => (
  <div ref={ref} className={`flex items-center p-6 pt-0 ${className}`}>{children}</div>
));
CardFooter.displayName = 'CardFooter';

interface CardTitleProps {
  className?: string;
  children: ReactNode;
}

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  CardTitleProps
>(({ className, children }, ref) => (
  <h3
    ref={ref}
    className={`text-lg font-semibold leading-none tracking-tight ${className}`}
  >
    {children}
  </h3>
));
CardTitle.displayName = 'CardTitle';

interface CardDescriptionProps {
  className?: string;
  children: ReactNode;
}

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className, children }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-muted-foreground ${className}`}
  >
    {children}
  </p>
));
CardDescription.displayName = 'CardDescription';