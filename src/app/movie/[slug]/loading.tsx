export default function MovieDetailLoading() {
  return (
    <div className="min-h-screen">
      {/* Backdrop skeleton */}
      <section className="relative h-[40vh] md:h-[55vh] min-h-[350px] overflow-hidden">
        <div className="w-full h-full bg-white/[0.03] animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/70 to-transparent" />
      </section>

      <div className="max-w-7xl mx-auto px-4 -mt-40 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster skeleton */}
          <div className="w-48 md:w-64 shrink-0 hidden md:block">
            <div className="aspect-[2/3] rounded-xl bg-white/[0.05] animate-pulse border border-white/10" />
          </div>

          <div className="flex-1 pt-4 md:pt-20">
            {/* Title */}
            <div className="h-10 md:h-14 w-3/4 bg-white/[0.05] animate-pulse rounded-lg mb-3" />

            {/* Meta info */}
            <div className="flex gap-3 mb-4">
              <div className="h-4 w-16 bg-white/[0.05] animate-pulse rounded" />
              <div className="h-4 w-20 bg-white/[0.05] animate-pulse rounded" />
              <div className="h-4 w-14 bg-white/[0.05] animate-pulse rounded" />
            </div>

            {/* Genre badges */}
            <div className="flex gap-2 mb-4">
              <div className="h-6 w-16 bg-white/[0.05] animate-pulse rounded-full" />
              <div className="h-6 w-20 bg-white/[0.05] animate-pulse rounded-full" />
              <div className="h-6 w-14 bg-white/[0.05] animate-pulse rounded-full" />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mb-6">
              <div className="h-10 w-10 bg-white/[0.05] animate-pulse rounded-full" />
              <div className="h-10 w-28 bg-white/[0.05] animate-pulse rounded-full" />
            </div>

            {/* Synopsis */}
            <div className="mb-8">
              <div className="h-5 w-24 bg-white/[0.05] animate-pulse rounded mb-2" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-white/[0.03] animate-pulse rounded" />
                <div className="h-3 w-5/6 bg-white/[0.03] animate-pulse rounded" />
                <div className="h-3 w-4/6 bg-white/[0.03] animate-pulse rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Player skeleton */}
        <section className="mt-8">
          <div className="aspect-video w-full bg-white/[0.03] animate-pulse rounded-xl" />
        </section>

        {/* Cast skeleton */}
        <section className="mt-10">
          <div className="h-6 w-28 bg-white/[0.05] animate-pulse rounded mb-4" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-20">
                <div className="w-20 h-20 rounded-full bg-white/[0.05] animate-pulse" />
                <div className="h-2 w-14 bg-white/[0.05] animate-pulse rounded mt-2 mx-auto" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
