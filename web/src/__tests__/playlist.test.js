import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const playlist = require('../audio/playlist.js');

describe('persistent audio playlist', () => {
  it('advances to the next track and wraps to the start', () => {
    expect(playlist.nextIndex(0, 3)).toBe(1);
    expect(playlist.nextIndex(2, 3)).toBe(0);
    expect(playlist.nextIndex(-1, 3)).toBe(0);
  });

  it('moves to the previous track and wraps to the end', () => {
    expect(playlist.previousIndex(2, 3)).toBe(1);
    expect(playlist.previousIndex(0, 3)).toBe(2);
  });

  it('returns no track for an empty playlist', () => {
    expect(playlist.nextIndex(0, 0)).toBe(-1);
    expect(playlist.previousIndex(0, 0)).toBe(-1);
  });
});
