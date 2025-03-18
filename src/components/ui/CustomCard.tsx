
import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

interface CustomCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  withGradientBorder?: boolean;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export function CustomCard({
  title,
  description,
  className,
  contentClassName,
  headerClassName,
  footerClassName,
  withGradientBorder = false,
  children,
  footer,
  ...props
}: CustomCardProps) {
  return (
    <Card
      className={cn(
        "transition-all duration-300 hover:shadow-md",
        withGradientBorder && "relative before:absolute before:inset-0 before:p-[1px] before:rounded-xl before:bg-gradient-to-r before:from-taskfinity-blue before:to-taskfinity-purple before:-z-10 border-transparent",
        className
      )}
      {...props}
    >
      {(title || description) && (
        <CardHeader className={cn("px-5 py-4", headerClassName)}>
          {title && <CardTitle className="text-lg font-semibold">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={cn("px-5 py-4", contentClassName)}>
        {children}
      </CardContent>
      {footer && (
        <CardFooter className={cn("px-5 py-4 border-t", footerClassName)}>
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
