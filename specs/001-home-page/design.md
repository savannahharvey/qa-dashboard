# Design: Home Page

## Route

`/`

## Page Component

Use a page component equivalent to the Figma prototype's `LandingPage`.

## Layout Notes

- Public app shell or minimal public layout.
- Product name and short value proposition.
- Primary sign-in action.
- Secondary sign-up action.
- Keep content concise so the page acts as an entry point rather than a long marketing site.

## State Handling

- Anonymous users see the landing content.
- Signed-in users should have an obvious path to the dashboard.
- If auth context is available during routing, redirect signed-in users to `/dashboard`.

## Testing Notes

- Use Playwright to render the page at `/`.
- Use Playwright to verify sign-in and sign-up links.
- Verify no protected dashboard data appears.
- Verify responsive layout at desktop and mobile widths.
