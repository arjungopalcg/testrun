import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    tone: {
      neutral: 'bg-muted text-muted-foreground',
      good: 'bg-secondary text-secondary-foreground',
      warning: 'bg-warning/25 text-warning-foreground dark:text-warning',
      loss: 'bg-destructive/15 text-destructive',
      info: 'bg-primary/15 text-primary',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export function Badge({ tone, className, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
