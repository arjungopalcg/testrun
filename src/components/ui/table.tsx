import * as React from 'react';
import { cn } from '@/lib/utils';

export const Table = ({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
  <div className="w-full overflow-x-auto rounded-lg border bg-card">
    <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
  </div>
);
export const THead = (props: React.HTMLAttributes<HTMLTableSectionElement>) => <thead className="bg-muted/60" {...props} />;
export const TBody = (props: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody className="[&_tr:last-child]:border-0" {...props} />;
export const TFoot = (props: React.HTMLAttributes<HTMLTableSectionElement>) => <tfoot className="border-t bg-muted/60 font-semibold" {...props} />;
export const TR = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn('border-b transition-colors', className)} {...props} />
);
export const TH = ({ className, numeric, ...props }: React.ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) => (
  <th className={cn('h-11 whitespace-nowrap px-3 text-left align-middle font-medium text-muted-foreground', numeric && 'text-right', className)} {...props} />
);
export const TD = ({ className, numeric, ...props }: React.TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) => (
  <td className={cn('px-3 py-2.5 align-middle', numeric && 'tabular text-right', className)} {...props} />
);
