/routes – Express route definitions, mapping endpoints to controller functions. For clarity, we can have separate route files:
authRoutes (e.g., /api/auth/* endpoints for login, OAuth callback, etc.),
userRoutes (/api/user/* for profile fetch, follow/unfollow),
characterRoutes (/api/characters/* for listing, creating, updating characters),
chatRoutes (/api/chat/* for sending a message, retrieving conversation),
imageRoutes (/api/image/* for image generation requests),
paymentRoutes (/api/payment/* for webhooks or checkout session creation),
etc.
These routes will be mounted on the Express app.