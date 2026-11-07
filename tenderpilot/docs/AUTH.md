# Authentication: SMS One-Time Code (OTP) Login

Users sign in with their phone number and a one-time code sent by SMS through the **Thrivewave** API.

> Status: spec only. Thrivewave endpoint details are not yet confirmed and are
> configured through environment variables (see `.env.example`). Stack-specific code comes once the frontend/backend stack is confirmed.

## Flow

1. User enters phone number (E.164 format, e.g. `+2547XXXXXXXX`).
2. Backend `POST /auth/request-code`
   - Normalizes and validates the number.
   - Applies rate limits (below).
   - Generates a random 6-digit code (cryptographically secure).
   - Stores a **hash** of the code with expiry and attempt counter. Never store the plain code.
   - Sends the SMS via the Thrivewave adapter.
   - Always returns the same generic response, whether or not the number is registered.
3. User enters the code.
4. Backend `POST /auth/verify-code`
   - Checks the hash, expiry, and attempt count.
   - On success: marks the code used, creates or loads the user, issues a session (HTTP-only secure cookie or short-lived JWT plus refresh token).
5. User is signed in. Sessions can be revoked on logout.

## Rules

| Rule | Value |
|------|-------|
| Code length | 6 digits |
| Code expiry | 5 minutes |
| Max verify attempts per code | 5, then code is invalidated |
| Resend cooldown | 60 seconds |
| Max code requests per number | 5 per hour |
| Max code requests per IP | 20 per hour |
| Code reuse | Never; single use |

## Data model (suggested)

```
users
  id, phone (unique, E.164), name, firm_id, role, created_at, last_login_at

otp_codes
  id, phone, code_hash, expires_at, attempts, used_at, created_at, ip

sessions
  id, user_id, created_at, expires_at, revoked_at
```

## SMS provider adapter

All SMS sending goes through one module so the provider can be swapped by editing a single file.

```
sendSms(to: string, message: string) -> { ok: boolean, providerMessageId?: string, error?: string }
```

The Thrivewave adapter reads its settings from environment variables:

- `THRIVEWAVE_API_URL`
- `THRIVEWAVE_API_KEY`
- `THRIVEWAVE_SENDER_ID`

Message template:

```
Your TenderPilot code is {code}. It expires in 5 minutes. Do not share it.
```

## Security notes

- Hash codes (e.g. HMAC-SHA256 with a server secret), never log them.
- Do not reveal whether a phone number is registered.
- Keep API keys in environment variables only, never in the repo.
- Log send attempts and failures (without the code) for audit.
- Add spend caps and alerts on SMS volume to prevent SMS-pumping abuse.
- Admin/director roles may later require a second factor.

## To confirm with Thrivewave

- [ ] Send-SMS endpoint and request body
- [ ] Authentication method
- [ ] Sender ID requirements
- [ ] Rate limits and delivery reports
