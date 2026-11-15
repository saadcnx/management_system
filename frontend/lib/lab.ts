export const STATUS_LABEL: Record<string, string> = {
  ORDERED: 'Ordered',
  SAMPLE_COLLECTED: 'Sample collected',
  RESULTS_ENTERED: 'Results entered',
  VERIFIED: 'Verified',
};

export const statusVariant = (s: string) =>
  (s === 'VERIFIED' ? 'success' : s === 'ORDERED' ? 'muted' : 'default') as 'success' | 'muted' | 'default';

export const payVariant = (s: string) =>
  (s === 'PAID' ? 'success' : s === 'PARTIAL' ? 'default' : 'muted') as 'success' | 'muted' | 'default';

export const money = (n: number) =>
  `Rs ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;