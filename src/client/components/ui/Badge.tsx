
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center",
    "border-2 border-black",
    "px-3 py-1",
    "text-xs font-bold uppercase tracking-wide",
    "shadow-[2px_2px_0px_0px_#000]"
  ],
  {
    variants: {
      variant: {
        default: "bg-white text-black",
        primary: "bg-yellow-400 text-black",
        secondary: "bg-orange-400 text-black",
        success: "bg-green-400 text-black",
        danger: "bg-red-400 text-white",
        warning: "bg-yellow-500 text-black",
        outline: "bg-transparent text-black"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}