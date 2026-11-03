export type DiffType = 'same' | 'added' | 'removed';
export interface DiffRun { type: DiffType; text: string; }

// Above this the comparison table gets heavy, so fall back to "all old, then all new".
const MAX_CELLS = 400_000;

// Words, whitespace runs and commas are separate tokens, so "a, b" -> "a" only flags ", b".
function tokenise(text: string): string[] {
  return text.split(/(\s+|,)/).filter((t) => t !== '');
}

export function diffText(oldText: string, newText: string): DiffRun[] {
  const a = tokenise(oldText);
  const b = tokenise(newText);
  const n = a.length;
  const m = b.length;
  const ops: DiffRun[] = [];

  if (n * m > MAX_CELLS) {
    if (oldText) ops.push({ type: 'removed', text: oldText });
    if (newText) ops.push({ type: 'added', text: newText });
    return ops;
  }

  // lcs[i][j] = length of the longest common subsequence of a[i..] and b[j..]
  const lcs = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  // Merge adjacent tokens of the same type into one run, so we render a few spans, not thousands.
  const push = (type: DiffType, text: string) => {
    const last = ops[ops.length - 1];
    if (last && last.type === type) last.text += text;
    else ops.push({ type, text });
  };

  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { push('same', a[i]); i++; j++; }
    else if (lcs[i + 1][j] >= lcs[i][j + 1]) { push('removed', a[i]); i++; }
    else { push('added', b[j]); j++; }
  }
  while (i < n) push('removed', a[i++]);
  while (j < m) push('added', b[j++]);

  return ops;
}