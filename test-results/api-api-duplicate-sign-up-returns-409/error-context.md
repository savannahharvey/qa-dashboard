# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api.spec.ts >> api: duplicate sign-up returns 409
- Location: e2e\api.spec.ts:26:1

# Error details

```
Error: apiRequestContext.post: connect ECONNREFUSED 127.0.0.1:4000
Call log:
  - → POST http://127.0.0.1:4000/api/auth/sign-up
    - user-agent: Playwright/1.61.0 (arm64; windows 10.0) node/22.15
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - content-type: application/json
    - content-length: 69

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const API_BASE = 'http://127.0.0.1:4000/api/auth';
  4  | 
  5  | test('api: sign-up and sign-in contract', async ({ request }) => {
  6  |   const username = `e2e_user_${Date.now()}`;
  7  |   const password = 'e2e-password-1';
  8  | 
  9  |   const signup = await request.post(`${API_BASE}/sign-up`, {
  10 |     data: { username, password, displayName: 'E2E User' },
  11 |   });
  12 |   expect(signup.status()).toBe(201);
  13 |   const signupBody = await signup.json();
  14 |   expect(signupBody.user).toBeTruthy();
  15 |   expect(signupBody.user.username).toBe(username);
  16 | 
  17 |   // Signing in should return user and teams
  18 |   const signin = await request.post(`${API_BASE}/sign-in`, { data: { username, password } });
  19 |   expect(signin.status()).toBe(200);
  20 |   const signinBody = await signin.json();
  21 |   expect(signinBody.user).toBeTruthy();
  22 |   expect(signinBody.user.username).toBe(username);
  23 |   expect(Array.isArray(signinBody.teams)).toBe(true);
  24 | });
  25 | 
  26 | test('api: duplicate sign-up returns 409', async ({ request }) => {
  27 |   const username = `e2e_user_dup_${Date.now()}`;
  28 |   const password = 'e2e-password-1';
  29 | 
> 30 |   const first = await request.post(`${API_BASE}/sign-up`, { data: { username, password } });
     |                               ^ Error: apiRequestContext.post: connect ECONNREFUSED 127.0.0.1:4000
  31 |   expect(first.status()).toBe(201);
  32 | 
  33 |   const second = await request.post(`${API_BASE}/sign-up`, { data: { username, password } });
  34 |   expect(second.status()).toBe(409);
  35 | });
  36 | 
```