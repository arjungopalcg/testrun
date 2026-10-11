// Chart colours read from the theme tokens so charts follow light/dark mode.
export const chart = {
  primary: 'var(--primary)',
  secondary: 'oklch(0.65 0.09 75)',  // latex-amber, distinct from primary in both themes
  loss: 'var(--destructive)',
  muted: 'var(--muted-foreground)',
  grid: 'var(--border)',
  rain: 'oklch(0.62 0.08 240)',
};
export const categorical = ['var(--primary)', 'oklch(0.65 0.09 75)', 'oklch(0.62 0.08 240)', 'oklch(0.55 0.1 25)', 'oklch(0.6 0.07 300)', 'oklch(0.7 0.08 130)', 'oklch(0.5 0.04 60)', 'oklch(0.72 0.06 200)'];
export const axisProps = { stroke: 'var(--muted-foreground)', fontSize: 12, tickLine: false, axisLine: false } as const;
export const tooltipStyle = { contentStyle: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--foreground)' } } as const;
