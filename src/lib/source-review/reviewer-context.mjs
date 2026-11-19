/** Display only adjacent sentences; source offsets and stored evidence remain unchanged. */
export function nearbyReviewContext(claim) {
  const start = claim.start - claim.contextStart;
  const end = claim.end - claim.contextStart;
  if (!Number.isInteger(start) || start < 0 || end > claim.context.length || claim.context.slice(start, end) !== claim.body) return null;
  const segments = (text) => text.split(/(?<=[.!?。！？])\s+|\n+/u).map((s) => s.trim()).filter(Boolean);
  const before = segments(claim.context.slice(0, start)).at(-1) ?? "";
  const after = segments(claim.context.slice(end))[0] ?? "";
  const paragraphStart = claim.context.lastIndexOf("\n", start - 1) + 1;
  const nextBreak = claim.context.indexOf("\n", end);
  const paragraph = claim.context.slice(paragraphStart, nextBreak < 0 ? claim.context.length : nextBreak).trim();
  const beforeChars = Array.from(before), afterChars = Array.from(after);
  return { before: beforeChars.length > 500 ? `…${beforeChars.slice(-500).join("")}` : before,
    after: afterChars.length > 500 ? `${afterChars.slice(0, 500).join("")}…` : after,
    paragraph: Array.from(paragraph).length > 1500 ? `${Array.from(paragraph).slice(0, 1500).join("")}…` : paragraph };
}
