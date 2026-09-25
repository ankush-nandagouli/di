# Platform Security Specifications & Access Architecture

This document describes the active, verified security controls across the Dakshyam Innovations platform (React + Express + MongoDB/Firestore).

## 1. Authentication & Session Security
- **Server-Side Validation**: All authentication requests are processed via `/api/auth/login` and `/api/auth/register`. Client-side authentication checks and hardcoded string comparisons have been completely removed.
- **Salted Password Hashing**: Passwords are encrypted server-side using `bcryptjs` with per-user salt rounds. Passwords and password hashes are never exposed in any API response or stored in plain text.
- **JWT Session Tokens**: Authenticated sessions issue signed JSON Web Tokens (JWT) using `JWT_SECRET`. Sensitive endpoints require `Authorization: Bearer <token>`.
- **Brute-Force & Rate Limiting**: The `/api/auth/login` endpoint is rate-limited via `express-rate-limit` (20 attempts per 15 minutes per IP). A global rate limiter guards all POST routes against automated floods.

## 2. Authorization & Role-Based Access Control (RBAC)
- **Three-Tier Role Hierarchy**: Distinct roles for `student`, `trainer`, and `admin`.
- **Middleware Guarding**:
  - `authenticateToken`: Validates JWT signature and attaches authenticated user payload (`id`, `email`, `role`, `name`) to `req.user`.
  - `requireRole(...roles)`: Enforces role permissions per endpoint.
- **Protected Endpoints**:
  - `/api/db/all`: Restricted to authenticated `admin`.
  - `/api/db/sync-all`: Restricted to authenticated `admin`.
  - `/api/db/clear`: Restricted to authenticated `admin` and requires explicit server confirmation phrase `{ confirmation: "CONFIRM_PERMANENT_DATABASE_CLEAR" }`.
  - `/api/db/:key`: Validates permissions per collection key (admin-only keys vs staff keys).
  - `/api/students`: Restricted to `admin` and `trainer` roles; student passwords/hashes are excluded.
  - `/api/certificates/:serial`: Public credential verification returning only public display fields (name, course, grade, serial, date), never full user records.
  - `/api/public/data`: Safe public bootstrap route delivering only non-sensitive catalog data (courses, banners, exhibition gallery, public feedback config).

## 3. Upload Security & Magic Byte Validation
- `/api/upload` requires an authenticated session.
- File buffers are inspected for magic bytes / file signatures to verify genuine content types:
  - Allowed: `image/png`, `image/jpeg`, `image/webp`, `video/mp4`, `video/webm`, `model/gltf-binary` (GLB).
  - Explicitly Forbidden: `.html`, `.svg`, executable binaries, and any file buffer containing `<script`, `<?php`, `<html`, `onload=`, or `onerror=`.
- Payload size limit is strictly enforced (maximum 20MB).

## 4. Verification & OTP Security
- Verification codes in `/api/verify/trigger` and `/api/verify/confirm` enforce an active 10-minute expiry window.
- Rate limiting guards trigger (max 5 requests per 15 minutes) and confirmation (max 10 attempts per 15 minutes).
- Failed attempts are capped at 5 before the code is invalidated.
- Raw OTP codes are never logged to console or logs in `production` environment.

## 5. Defense-in-Depth Firestore Rules
- Authoritative operational logic runs through Express / MongoDB with server-side validation.
- Firestore security rules (`firestore.rules`) enforce default-deny:
  - Students can only read/update their own document (`request.auth.uid == studentId`).
  - Sensitive settings (including `supervisor_pin`) can only be read or written by verified administrators.
  - Workshop feedback submissions from the public can create entries with validated schemas, but only administrators can read, update, or delete submissions.
