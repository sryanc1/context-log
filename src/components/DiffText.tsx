import { useMemo } from 'react';
import { diffText, type DiffRun } from '../utils/diff';

const CONTEXT_CHARS = 40;

// Long unchanged stretches become a short stub either side of the change.
function trimUnchanged(runs: DiffRun[]): DiffRun[] {
  return runs.map((run, i) => {
    if (run.type !== 'same' || run.text.length <= CONTEXT_CHARS * 2) return run;
    const isFirst = i === 0;
    const isLast = i === runs.length - 1;
    if (isFirst && isLast) return run;
    const head = run.text.slice(0, CONTEXT_CHARS);
    const tail = run.text.slice(-CONTEXT_CHARS);
    if (isFirst) return { ...run, text: `…${tail}` };
    if (isLast) return { ...run, text: `${head}…` };
    return { ...run, text: `${head} … ${tail}` };
  });
}

interface DiffTextProps {
  oldValue: string;
  newValue: string;
  compact?: boolean;
}

export function DiffText({ oldValue, newValue, compact = false }: DiffTextProps) {
  const runs = useMemo(() => {
    const full = diffText(oldValue, newValue);
    return compact ? trimUnchanged(full) : full;
  }, [oldValue, newValue, compact]);

  return (
    <div className={compact ? 'diff-text diff-text-compact' : 'diff-text'}>
      {runs.map((run, i) =>
        run.type === 'same' ? (
          <span key={i}>{run.text}</span>
        ) : (
          <span key={i} className={run.type === 'added' ? 'diff-added' : 'diff-removed'}>
            {run.text}
          </span>
        )
      )}
    </div>
  );
}