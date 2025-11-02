# Validate Discord Signature Worker

A cloudflare worker to validate discord signature.

## Request

These headers are necessary:

- `x-auth-token`
    - The token to access this worker. Its value is defined by the worker.
- `X-Signature-PublicKey`
    - Your Discord application's public key.
- `X-Signature-Ed25519`
    - From Discord.
- `X-Signature-Timestamp`
    - From Discord.

And the body of your request should be same as the body of the Discord request.

## Response

```json
{"isValid":true}
```

## Deploy

Set these environment variables:

- `AUTH_TOKEN`
