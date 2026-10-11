import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'warning' | 'loss';
}

export function StatCard({ label, value, hint, tone = 'default' }: StatCardProps) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          'tabular mt-1 text-2xl font-semibold',
          tone === 'warning' && 'text-warning-foreground dark:text-warning',
          tone === 'loss' && 'text-destructive',
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
