

interface CardProps {
  children: React.ReactNode;
}

export function Card({ children }: CardProps) {
  return (
    <div className="border-2 border-border bg-secondary-background p-4 md:p-8 my-2 md:my-4 shadow-shadow rounded-base">
      <div className="space-y-4 md:space-y-6">
        {children}
      </div>
    </div>
  );
}
