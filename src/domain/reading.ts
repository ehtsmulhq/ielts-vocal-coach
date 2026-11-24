/** Checks for audio rendered by a conversational (Live) model reading a script. */

const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

/**
 * Share of the script's words that appear, in order, in what was actually
 * spoken (longest common subsequence / script length). 1 = read verbatim.
 */
export function readingCoverage(script: string, spoken: string): number {
  const a = words(script);
  const b = words(spoken);
  if (a.length === 0) return 1;
  if (b.length === 0) return 0;
  let prev = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array<number>(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    }
    prev = cur;
  }
  return prev[b.length] / a.length;
}

/** Spoken words that were not in the script (chatter such as "Sure! Here it is"). */
export function extraWordRatio(script: string, spoken: string): number {
  const a = words(script).length;
  const b = words(spoken).length;
  return a === 0 ? 0 : Math.max(0, b - a) / a;
}

/** A reading is accepted when nearly every word was read and little was added. */
export function isFaithfulReading(script: string, spoken: string): boolean {
  return readingCoverage(script, spoken) >= 0.92 && extraWordRatio(script, spoken) <= 0.1;
}
