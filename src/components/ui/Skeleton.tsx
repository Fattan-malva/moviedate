export default function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-white/[0.05] ${className}`}
    />
  );
}

export function MovieCardSkeleton() {
  return (
    <div className="w-[140px] md:w-[160px] flex-shrink-0 flex flex-col">
      <Skeleton className="aspect-[2/3] w-full rounded-lg" />
      <Skeleton className="h-3 w-3/4 mt-2 rounded" />
      <Skeleton className="h-2 w-1/2 mt-1 rounded" />
    </div>
  );
}

export function MovieGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[2/3] w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4 mt-2.5 rounded-lg" />
          <Skeleton className="h-3 w-1/2 mt-1 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
