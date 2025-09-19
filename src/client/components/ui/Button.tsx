
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center",
    "border-2 border-black",
    "font-bold text-sm uppercase tracking-wide",
    "px-4 py-2",
    "shadow-[3px_3px_0px_0px_#000]",
    "transition-all duration-200",
    "hover:shadow-[5px_5px_0px_0px_#000]",
    "hover:translate-x-[-1px] hover:translate-y-[-1px]",
    "active:shadow-[1px_1px_0px_0px_#000]",
    "active:translate-x-[2px] active:translate-y-[2px]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "disabled:hover:shadow-[3px_3px_0px_0px_#000]",
    "disabled:hover:translate-x-0 disabled:hover:translate-y-0"
  ],
  {
    variants: {
      variant: {
        primary: "bg-yellow-400 text-black hover:bg-yellow-300",
        secondary: "bg-orange-400 text-black hover:bg-orange-300",
        success: "bg-green-400 text-black hover:bg-green-300",
        danger: "bg-red-400 text-white hover:bg-red-300",
        outline: "bg-white text-black hover:bg-gray-100",
        ghost: "bg-transparent shadow-none border-none hover:bg-gray-100 hover:shadow-none hover:translate-x-0 hover:translate-y-0"
      },
      size: {
        sm: "px-3 py-1 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
        xl: "px-8 py-4 text-lg"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </button>
  );
}