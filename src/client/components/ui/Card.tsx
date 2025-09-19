
import { cn } from "../../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  shadow?: "sm" | "md" | "lg";
  hover?: boolean;
}

export function Card({
  className,
  shadow = "md",
  hover = true,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "border-2 border-black bg-white p-6 transition-all duration-200",
        {
          "shadow-[2px_2px_0px_0px_#000]": shadow === "sm",
          "shadow-[4px_4px_0px_0px_#000]": shadow === "md",
          "shadow-[8px_8px_0px_0px_#000]": shadow === "lg",
          "hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px]": hover && shadow === "md",
          "hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px]": hover && shadow === "sm",
          "hover:shadow-[10px_10px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]": hover && shadow === "lg"
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-2xl font-bold uppercase tracking-wide", className)}
      {...props}
    >
      {children}
    </h2>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {children}
    </div>
  );
}