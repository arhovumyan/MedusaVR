# Email Verification System Setup

This document explains how to set up the email verification system for MedusaVR using SendGrid.

## Overview

The email verification system has been implemented with the following features:

- **Real email delivery** via SendGrid API
- **Secure verification tokens** that expire in 24 hours
- **Prevents login** until email is verified
- **Resend verification email** functionality
- **Professional email templates** with branding
- **Graceful fallback** when SendGrid is not configured (development mode)

## Required Environment Variables

Add these environment variables to your `.env` file:

```bash
# SendGrid Configuration (Required for Production)
SENDGRID_API_KEY=your_sendgrid_api_key_here

# Email Settings
EMAIL_FROM=noreply@medusavr.com
BASE_URL=https://medusavr.com
```

## SendGrid Setup Instructions

### 1. Create a SendGrid Account

1. Go to [SendGrid.com](https://sendgrid.com/)
2. Sign up for a free account (100 emails/day free tier)
3. Verify your account via email

### 2. Generate API Key

1. Login to SendGrid dashboard
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Choose **Restricted Access**
5. Give it permissions for **Mail Send** only
6. Copy the generated API key

### 3. Verify Sender Identity

1. Go to **Settings** → **Sender Authentication**
2. Choose one of these options:
   - **Single Sender Verification**: Verify the email address you want to send from
   - **Domain Authentication**: Verify your entire domain (recommended for production)

### 4. Update Environment Variables

Add your SendGrid API key to your environment:

```bash
SENDGRID_API_KEY=SG.your_api_key_here
EMAIL_FROM=noreply@yourdomain.com  # Must match verified sender
```

## Email Flow

### Registration Process

1. User signs up with email, username, and password
2. Account is created with `verified: false`
3. Verification email is sent via SendGrid
4. User receives professional email with verification link
5. User clicks link → redirected to `/verify-email?token=...`
6. Token is validated and account is marked as verified

### Login Process

1. User attempts to login
2. If email is not verified → login is blocked
3. Error message shows with "Resend Verification Email" button
4. User can request new verification email

## Development Mode

When `SENDGRID_API_KEY` is not set:

- Email content is logged to console instead of sent
- Verification URLs are displayed in server logs
- System continues to work for testing

## Email Template

The verification email includes:

- **Professional MedusaVR branding**
- **Clear call-to-action button**
- **24-hour expiration notice**
- **User responsibility disclaimer**
- **Fallback text version**
- **Links to legal pages**

## API Endpoints

### Verify Email
```
GET /api/auth/verify-email?token=verification_token
```

### Resend Verification
```
POST /api/auth/resend-verification
Body: { "email": "user@example.com" }
```

## Security Features

- **Cryptographically secure tokens** (32 bytes)
- **24-hour token expiration**
- **Rate limiting** on verification endpoints
- **Input validation** and sanitization
- **Error handling** without information leakage

## Testing

### Local Testing

1. Set `SENDGRID_API_KEY` in your `.env` file
2. Start the server: `npm run dev`
3. Sign up with a real email address
4. Check your inbox for verification email
5. Click the verification link
6. Try logging in

### Without SendGrid (Development)

1. Remove or comment out `SENDGRID_API_KEY`
2. Check server console for verification URLs
3. Manually visit the verification URL
4. Test the complete flow

## Troubleshooting

### Email Not Received

1. Check spam/junk folder
2. Verify SendGrid API key is correct
3. Ensure sender email is verified in SendGrid
4. Check SendGrid dashboard for delivery stats

### Verification Link Not Working

1. Check if token has expired (24 hours)
2. Verify BASE_URL is correct
3. Check server logs for errors
4. Use "Resend Verification Email" feature

### API Errors

1. Check SendGrid API key permissions
2. Verify sender authentication
3. Check rate limits in SendGrid dashboard
4. Review server logs for detailed errors

## Production Considerations

1. **Use domain authentication** instead of single sender verification
2. **Set up proper DNS records** for better deliverability
3. **Monitor SendGrid analytics** for bounce rates
4. **Implement email reputation management**
5. **Consider upgrading SendGrid plan** if needed (free tier: 100 emails/day)

## Environment Configuration Summary

```bash
# Required for email verification
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com
BASE_URL=https://yourdomain.com

# Optional (defaults shown)
# EMAIL_FROM defaults to noreply@medusavr.com
# BASE_URL defaults to https://medusavr.com
```

The system is now fully functional and secure for production use!
