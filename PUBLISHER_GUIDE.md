# Publisher Integration Guide

Connect your specialist AI service to the Neuromart marketplace and start receiving qualified renters with automated token provisioning.

> Current implementation note
>
> This guide documents the token and access model that exists in the current MVP. It does not yet include the hardened entitlement features planned for Phase 2, such as token expiry, refresh or rotation flows, revocation handling, or scope-based capabilities.
>
> Recent hardening completed: route ID validation is now strict, token validation now resolves rentals by ID (not paginated list scanning), and quality-ranked listing responses are ordered before pagination when quality sorting is requested.

---

## Overview

As a publisher on Neuromart, you expose a specialist AI product — whether it's a prompt-only workflow, a provider-backed model, an external REST API, or a self-hosted inference server. The platform handles discovery, renter onboarding, and access token management so you can focus on serving requests.

**What happens when someone rents your listing:**

1. Renter activates a rental from the marketplace.
2. Platform creates a unique managed token: `nm_{rentalId}_auth_token`.
3. Renter uses this token to call your API endpoint via the platform proxy or directly.
4. You validate the token on your side using our validate endpoint.
5. Platform tracks activations — your Dashboard shows real-time renter and wallet metrics.

---

## Quick Start

### 1. Register a Publisher Account

```http
POST /api/users
Content-Type: application/json

{
  "username": "your-handle",
  "displayName": "Studio Name or Company"
}
```

Response:
```json
{
  "id": 5,
  "username": "your-handle",
  "displayName": "Studio Name or Company"
}
```

Save your `id` — this is your `creatorId` used in all model operations.

---

### 2. Publish a Listing

```http
POST /api/models
Content-Type: application/json

{
  "name": "Contract Risk Analyzer",
  "description": "Multi-pass contract analysis that surfaces hidden clauses, renewal traps, and negotiation pressure points in commercial agreements.",
  "category": "Legal & Security",
  "specialistNiche": "Contract Small Print Scanner",
  "onboardingMode": "external_api",
  "pricingModel": "per_request",
  "pricePerQuery": "0.15",
  "pricingLabel": "$0.15 per request",
  "modelStatus": "published",
  "provider": "custom",
  "apiBaseUrl": "https://api.yourservice.com/v1",
  "apiDocsUrl": "https://docs.yourservice.com",
  "accessSummary": "API key issued immediately after purchase. Supports batch and single-document analysis. SLA: 99.9%.",
  "tags": "contracts,legal,compliance,risk",
  "version": "2.1",
  "creatorId": 5
}
```

**`onboardingMode` options:**

| Mode | Description |
|---|---|
| `prompt_only` | You supply a system prompt; the platform runs inference on a common provider |
| `provider_backed` | Your service wraps a known provider (OpenAI, Anthropic, etc.) |
| `external_api` | You expose a custom REST API endpoint |
| `self_hosted` | Custom on-premise or VPC deployment |

**`category` options:** `DeFi & Web3`, `Industrial`, `Bio-Tech`, `Creative & Media`, `Legal & Security`, `Engineering & DevOps`, `Logistics`, `Academic & Research`, `Urban & Civic`, `Strategy`, `Custom`

---

### 3. Update a Listing

```http
PATCH /api/models/:id
Content-Type: application/json

{
  "modelStatus": "published",
  "pricingLabel": "$0.12 per request",
  "pricePerQuery": "0.12",
  "accessSummary": "Updated onboarding: API key issued on payment confirmation. New batch endpoint available."
}
```

All fields are optional — only pass what you want to change.

Listing lifecycle statuses currently supported: `draft`, `published`, `beta`, `paused`, `deprecated`, `archived`.

---

### 4. Take a Listing Offline

```http
DELETE /api/models/:id
```

Returns `204 No Content`. Active rentals continue to resolve but no new rentals can be created.

---

## Token System

When a renter activates your listing, a managed token is provisioned:

```
nm_{rentalId}_auth_token
```

This token is shown to the renter in their Dashboard and should be passed as a Bearer token in requests to your API:

```http
POST https://api.yourservice.com/v1/analyze
Authorization: Bearer nm_42_auth_token
Content-Type: application/json

{
  "document": "..."
}
```

### Validating a Token

On each inbound request to your service, validate the token with the platform:

```http
POST /api/validate-token
Content-Type: application/json

{
  "token": "nm_42_auth_token"
}
```

Validation now performs a direct rental-by-id lookup after token parsing, which avoids pagination-related false negatives when the rental table grows.

**Success response (200):**
```json
{
  "valid": true,
  "rentalId": 42,
  "modelId": 7,
  "renterId": 3,
  "status": "active"
}
```

**Invalid or expired token (401):**
```json
{
  "valid": false,
  "error": "Token not found or rental is not active"
}
```

**Token format error (400):**
```json
{
  "valid": false,
  "error": "Invalid token format"
}
```

### Middleware Example (Node.js / Express)

```js
async function verifyNeuromartToken(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = auth.slice(7); // strip "Bearer "

  const response = await fetch('https://neuromart.example.com/api/validate-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  const result = await response.json();
  if (!result.valid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.rentalContext = result; // { rentalId, modelId, renterId }
  next();
}
```

### Current MVP Boundaries

The current token system is intentionally simple and should be treated as an MVP integration contract:

- Tokens are validated against active rental state.
- The validation response currently returns rental identity and status only.
- There is no expiry timestamp in the validation response yet.
- There is no token refresh flow yet.
- There is no revocation endpoint or webhook yet.
- There is no scope-based access model yet.

Current behavior improvements included in MVP:

- Route IDs are validated as positive integers before model, rental, and stats operations.
- Token validation is deterministic for any rental ID, not just rentals included in default paginated list responses.

If you are integrating now, build against the current validation behavior shown above. If you need hardened access controls, plan for a Phase 2 migration.

### Phase 2 Planned Guide Updates

When hardened entitlements are implemented, this guide must be updated to include:

- Token expiry semantics and how publishers should cache validation results.
- Refresh or rotation flows for long-lived integrations.
- Revocation endpoints and any revocation webhook behavior.
- Scope-based access control if rentals or service tiers expose different capabilities.
- Recommended token rotation and key hygiene best practices for publishers.

### Platform Internals (No Publisher Payload Changes)

Recent platform improvements include database indexes for listing queries and an internal `updatedAt` timestamp on models. These are backend performance and auditability improvements only.

Publisher API payloads do not need to include `updatedAt` and do not change because of index additions.

---

## Publisher Analytics

### Get listing stats

```http
GET /api/models/:id/stats
```

Response:
```json
{
  "modelId": 7,
  "totalRentals": 24,
  "activeRentals": 19
}
```

Use this to understand your activation rate and monitor churn.

---

## Listing Quality

The platform computes a quality score (0–6) for every listing based on completeness:

| Criterion | Points |
|---|---|
| Name (≥ 4 chars) | 1 |
| Description (≥ 80 chars) | 1 |
| Specialist niche set | 1 |
| Docs URL set | 1 |
| Access summary set | 1 |
| At least one tag | 1 |

**Quality tiers:**

| Tier | Score | Badge |
|---|---|---|
| `needs_work` | 0–2 | Grey |
| `verified` | 3–4 | Amber |
| `premium` | 5–6 | Emerald |

Premium listings appear first when buyers use the quality filter. To reach Premium, fill in: a detailed description, your specialist niche, a docs URL, an access summary, and at least one tag.

---

## Lifecycle Summary

```
Create user → POST /api/users
          ↓
Publish listing → POST /api/models  (modelStatus: "draft", "published", or "paused")
          ↓
Renter activates → rental created, token nm_{rentalId}_auth_token issued
          ↓
Renter calls your API → Authorization: Bearer nm_{rentalId}_auth_token
          ↓
Your server validates → POST /api/validate-token
          ↓
Monitor activations → GET /api/models/:id/stats
          ↓
Update or retire → PATCH /api/models/:id  /  DELETE /api/models/:id
```

---

## FAQ

**Can I have multiple listings?**  
Yes. Each `POST /api/models` creates an independent listing. Track them by `creatorId`.

**What happens if a renter's rental is cancelled?**  
The rental status changes to `cancelled`. Token validation will return `{ valid: false }`, blocking further access.

**Can I serve multiple renters from one API key on my side?**  
Yes. Validate each `nm_*` token independently and use the `renterId` in the response to associate usage with the correct renter in your own logging.

**Is there a rate limit on token validation?**  
No per-publisher rate limit currently. Cache validation results for 30–60 seconds on your side for high-throughput services.

**How do I update pricing without breaking active renters?**  
Use `PATCH /api/models/:id` to update `pricingLabel` and `pricePerQuery`. Active rentals are not affected — they continue at the rate locked in when they were created.
