import { useMemo } from 'react';
import { diffText } from '../utils/diff';

interface DiffTextProps {
  oldValue: string;
  newValue: string;
}

export function DiffText({ oldValue, newValue }: DiffTextProps) {
  const runs = useMemo(() => diffText(oldValue, newValue), [oldValue, newValue]);

  return (
    <div className="diff-text">
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