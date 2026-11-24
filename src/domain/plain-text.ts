/**
 * Learner-supplied text goes into the coach's prompt and events as one plain
 * line: no control characters or line separators, and it can't close the
 * <<< >>> delimiters that mark it as data.
 */
export function plainText(s: string): string {
  return s
    .replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]+/g, " ")
    .replace(/<<<|>>>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
