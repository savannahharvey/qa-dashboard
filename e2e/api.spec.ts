import { test, expect } from '@playwright/test';

const API_BASE = 'http://127.0.0.1:4000/api/auth';

test('api: sign-up and sign-in contract', async ({ request }) => {
  const username = `e2e_user_${Date.now()}`;
  const password = 'e2e-password-1';

  const signup = await request.post(`${API_BASE}/sign-up`, {
    data: { username, password, displayName: 'E2E User' },
  });
  expect(signup.status()).toBe(201);
  const signupBody = await signup.json();
  expect(signupBody.user).toBeTruthy();
  expect(signupBody.user.username).toBe(username);

  // Signing in should return user and teams
  const signin = await request.post(`${API_BASE}/sign-in`, { data: { username, password } });
  expect(signin.status()).toBe(200);
  const signinBody = await signin.json();
  expect(signinBody.user).toBeTruthy();
  expect(signinBody.user.username).toBe(username);
  expect(Array.isArray(signinBody.teams)).toBe(true);
});

test('api: duplicate sign-up returns 409', async ({ request }) => {
  const username = `e2e_user_dup_${Date.now()}`;
  const password = 'e2e-password-1';

  const first = await request.post(`${API_BASE}/sign-up`, { data: { username, password } });
  expect(first.status()).toBe(201);

  const second = await request.post(`${API_BASE}/sign-up`, { data: { username, password } });
  expect(second.status()).toBe(409);
});
