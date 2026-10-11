import { cn } from '@/lib/utils';

export const Skeleton = ({ className }: { className?: string }) => <div className={cn('animate-pulse rounded-md bg-muted', className)} />;

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 rounded-lg border bg-card p-3" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-9 w-full" />)}
    </div>
  );
}

export function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy="true">
      {Array.from({ length: count }, (_, i) => <Skeleton key={i} className="h-24" />)}
    </div>
  );
}
