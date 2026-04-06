import { Badge } from '@/components/ui/badge';
import type { StatoScuola } from '@/data/types';

const statusConfig: Record<StatoScuola, { label: string; className: string }> = {
  'In attesa test': { label: 'In attesa test', className: 'bg-secondary text-secondary-foreground' },
  'In attesa classe': { label: 'In attesa classe', className: 'bg-accent text-accent-foreground' },
  'Assegnato': { label: 'Assegnato', className: 'bg-primary text-primary-foreground' },
  'Inattivo': { label: 'Inattivo', className: 'bg-muted text-muted-foreground' },
};

export function StatusBadge({ stato }: { stato: StatoScuola }) {
  const config = statusConfig[stato];
  return <Badge className={config.className}>{config.label}</Badge>;
}
