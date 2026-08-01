export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function randomId(prefix = ""): string {
  const id = crypto.randomUUID().replace(/-/g, "");
  return prefix ? `${prefix}_${id}` : id;
}

export function randomEditToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomCursorCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const a = letters[Math.floor(Math.random() * letters.length)]!;
  const b =
    Math.random() > 0.5
      ? letters[Math.floor(Math.random() * letters.length)]!
      : digits[Math.floor(Math.random() * digits.length)]!;
  return `${a}${b}`;
}

export function pairKey(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}
