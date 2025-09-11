/middleware – Express middleware for things like:
Authentication middleware – checks if user is logged in (e.g., verifying a JWT or session cookie), attaches user info to req. If using Clerk, their SDK might handle this. If using our own, we could use Passport.js or express-jwt.
Rate Limiting – to prevent abuse of free tier (e.g., limit image gens per minute for free users). Could use libraries like express-rate-limit or custom logic.
Subscription check – a middleware to guard certain routes: e.g., only Deluxe/Elite can access /api/voice or /api/video. Or to inject the user’s tier into request so controllers can easily branch logic (for example, if a free user tries to generate an image, we check coin balance or deny if not allowed).
Logging and error handling – e.g., using Morgan for logging requests, and a global error handler to catch exceptions and send safe responses.
