import type { ActivityEntry } from '../types/items';
import { DiffText } from './DiffText';

const FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  description: 'Description',
  type: 'Type',
  priority: 'Priority',
  status: 'Status',
  tags: 'Tags',
  dueDate: 'Due date',
};

// updateItem logs '(none)' as a placeholder for an empty tag list; treat it as empty here.
const cleanValue = (v: string) => (v === '(none)' ? '' : v);

interface ActivityChangeProps {
  entry: ActivityEntry;
  compact?: boolean;
  plainClassName: string;
}

export function ActivityChange({ entry, compact = false, plainClassName }: ActivityChangeProps) {
  const { fieldChanged, oldValue, newValue } = entry;

  // Created / moved entries (and anything logged without old+new values) keep the plain sentence.
  if (!fieldChanged || entry.action === 'moved' || oldValue === undefined || newValue === undefined) {
    return <div className={plainClassName}>{entry.description}</div>;
  }

  return (
    <>
      <div className="activity-label">{FIELD_LABELS[fieldChanged] ?? fieldChanged} changed</div>
      <DiffText oldValue={cleanValue(oldValue)} newValue={cleanValue(newValue)} compact={compact} />
    </>
  );
}