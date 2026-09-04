export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse">
      <div className="h-10 w-56 rounded-xl bg-neutral-200" />
      <div className="mt-8 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="h-64 rounded-[2rem] bg-neutral-900" />
        <div className="h-64 rounded-[2rem] bg-white" />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div className="h-36 rounded-[1.6rem] bg-white" key={item} />
        ))}
      </div>
    </div>
  );
}
