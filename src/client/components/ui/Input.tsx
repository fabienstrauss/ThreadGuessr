
import { cn } from "../../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        [
          "flex w-full",
          "border-2 border-black bg-white",
          "px-3 py-2",
          "text-black font-medium",
          "shadow-[2px_2px_0px_0px_#000]",
          "transition-all duration-200",
          "focus:shadow-[4px_4px_0px_0px_#000]",
          "focus:translate-x-[-1px] focus:translate-y-[-1px]",
          "focus:outline-none",
          "placeholder:text-gray-500",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        ],
        className
      )}
      {...props}
    />
  );
}