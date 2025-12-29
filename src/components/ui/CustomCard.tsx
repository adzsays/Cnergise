
import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

interface CustomCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: string | React.ReactNode;
  description?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  titleExtra?: React.ReactNode;
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
  titleExtra,
  children,
  footer,
  ...props
}: CustomCardProps) {
  return (
    <Card
      className={cn(
        "bg-card border border-border rounded-md shadow-card transition-shadow duration-150 hover:shadow-card-hover",
        className
      )}
      {...props}
    >
      {(title || description) && (
        <CardHeader className={cn("px-4 py-4 md:px-6", headerClassName)}>
          <div className="flex items-center justify-between w-full">
            {typeof title === 'string' ? (
              <CardTitle className="text-base font-medium">{title}</CardTitle>
            ) : (
              title
            )}
            {titleExtra && (
              <div>{titleExtra}</div>
            )}
          </div>
          {description && <CardDescription className="text-sm">{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={cn("px-4 py-4 md:px-6", contentClassName)}>
        {children}
      </CardContent>
      {footer && (
        <CardFooter className={cn("px-4 py-4 md:px-6 border-t", footerClassName)}>
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
