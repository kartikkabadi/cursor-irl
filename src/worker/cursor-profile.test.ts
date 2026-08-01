import { describe, expect, it } from 'vitest';
import { extractCursorTokens } from './cursor-profile';

describe('Cursor public profile usage parsing', () => {
  it('sums the public tokensOverTime series', () => {
    const html = String.raw`"tokensOverTime":[{"date":"2026-08-01","tokens":35006386},{"date":"2026-08-02","tokens":80052189}]`;
    expect(extractCursorTokens(html)).toBe(115058575);
  });

  it('returns null when a profile does not expose usage', () => {
    expect(extractCursorTokens('<html>no public usage</html>')).toBeNull();
  });
});
