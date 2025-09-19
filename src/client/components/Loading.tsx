
import { Card } from "./Card";

export function Loading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse">
      <Card>
        <div className="h-64 w-full rounded-xl bg-zinc-200" />
        <div className="mt-4 h-5 w-3/4 rounded bg-zinc-200" />
        <div className="mt-4 flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 w-24 rounded-2xl bg-zinc-200" />
          ))}
        </div>
      </Card>
    </div>
  );
}