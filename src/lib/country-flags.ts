export function countryCodeToFlagEmoji(code: string): string {
  const cc = (code || "").toUpperCase();
  if (cc.length !== 2) return "";
  const A = 0x1f1e6;
  const a = 0x41;
  const first = cc.charCodeAt(0) - a;
  const second = cc.charCodeAt(1) - a;
  if (first < 0 || first > 25 || second < 0 || second > 25) return "";
  return String.fromCodePoint(A + first, A + second);
}
