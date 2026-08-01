import { beforeEach, describe, expect, it } from 'vitest';
import { clearProfileSession, getProfileSession, saveProfileSession } from './storage';

describe('profile session storage', () => {
  beforeEach(() => localStorage.clear());
  it('stores a token without making it part of the active profile id', () => {
    saveProfileSession('profile-1', 'secret-token');
    expect(getProfileSession()).toEqual({ id: 'profile-1', token: 'secret-token' });
    expect(localStorage.getItem('cursor-irl:active-profile')).toBe('profile-1');
  });
  it('clears the active profile and its token', () => {
    saveProfileSession('profile-1', 'secret-token');
    clearProfileSession();
    expect(getProfileSession()).toBeNull();
    expect(localStorage.getItem('cursor-irl:edit-token:profile-1')).toBeNull();
  });
});
