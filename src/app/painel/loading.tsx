import { NumberGridSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="h-36 animate-pulse rounded-3xl bg-navy/20" />
      <div className="mt-6 rounded-3xl bg-white p-5">
        <NumberGridSkeleton />
      </div>
    </div>
  );
}
