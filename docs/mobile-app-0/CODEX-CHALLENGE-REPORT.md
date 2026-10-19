# Codex Challenge Report

## What the package gets right

- React Native + Expo + TypeScript matches the existing language and product needs.
- Assessment before signup preserves STHENO's acquisition wedge.
- Shared engines and data prevent an expensive second product.
- Native V1 should focus on member capability, not copy the marketing site.
- Offline workouts and store-compliant billing are correctly treated as core product concerns.

## Changes required

### 1. Foundation must precede screens

The current backend is web-cookie oriented. A mobile shell built first would either fail authentication or couple directly to database tables. App 1 must deliver the bearer-auth API and contracts before visible feature work.

### 2. “Share the fitness engine” needs a boundary

Pure rules, types, validators, and fixtures should be shared. Program creation, adaptations, Coach execution, billing, and multi-record persistence remain server-authoritative. Shipping the complete engine on-device increases drift and tampering risk.

### 3. Anonymous assessment needs a backend identity

Browser localStorage cannot provide cross-device resume, emailed resume links, staged photos, or safe exactly-once claim. A hashed opaque token and transactional claim model are prerequisites, not later polish.

### 4. Existing idempotency is not offline support

Unique client keys protect some inserts, but edits, deletes, substitutions, completion, retries, concurrent devices, and derived progress still need an explicit operation protocol.

### 5. Billing is too large to hide inside onboarding

Apple/Google products, receipt verification, server notifications, restore, refunds, grace, regional rules, and reconciliation justify an App 2B gate separate from account linking.

### 6. Workout and media should not share a gate

Offline workout correctness is the hardest engineering problem. Exercise media has separate licensing/provenance/performance risk. Split App 4 into 4A and 4B.

### 7. Media rights are unproven for the requested use

The available provider language supports web/SaaS use but does not expressly address native store distribution, bundling, caching, or offline downloads. The 298 hosted assets also exceed the 61 ready manifest entries. Written rights and provenance are mandatory.

### 8. Push work starts earlier

Device registration, preferences, consent, timezone, and analytics identity affect App 3 data models. Final copy/tuning can remain App 6, but infrastructure should not.

### 9. A six-sprint promise is false precision

The plan represents at least eight substantial workstreams. Retain six release milestones with subphases and gates, then estimate after technical spikes. Do not commit dates before closing P0 unknowns.

## Final challenge

The mobile initiative should be described as a new trusted client for the existing STHENO platform—not a conversion of the website into an app. Success is one set of rules, one member record, one entitlement decision, and one auditable history across web and native.
