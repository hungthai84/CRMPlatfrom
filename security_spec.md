# ONECRM Security Specification & Threat Model

## 1. Data Invariants
1. **Multi-Tenant Isolation**: Every CRM entity belongs to an `organizationId` under `/organizations/{orgId}/{collection}/{docId}`. Users can only read/write documents belonging to an organization they own (`ownerId == request.auth.uid`) or where they are verified admins.
2. **Identity Integrity**: On creation, `ownerId` must strictly equal `request.auth.uid`, and `email_verified` must be `true`.
3. **Immutable Ownership & Origin**: `ownerId`, `organizationId`, and `createdAt` cannot be modified on update.
4. **PII Isolation**: User profile documents at `/users/{userId}` contain PII (`email`, `role`) and are restricted strictly to `request.auth.uid == userId` or `isAdmin()`. Users cannot self-escalate their `role` on update.
5. **Audit Log Integrity**: Audit logs at `/organizations/{orgId}/audit_logs/{logId}` are append-only for members; only admins may delete or alter them.
6. **Zero-Trust List Queries**: Every `allow list` rule evaluates `resource.data.ownerId == request.auth.uid || isAdmin()` without performing `get()` or `exists()` reads.

## 2. The "Dirty Dozen" Adversarial Payloads
1. Unauthenticated read on `/organizations/org_1/customers/cust_1` -> `PERMISSION_DENIED`.
2. Unverified email user creating `/organizations/org_1/customers/cust_1` -> `PERMISSION_DENIED`.
3. Spoofed `ownerId` (`ownerId: "victim_uid"`) on create -> `PERMISSION_DENIED`.
4. Cross-tenant `organizationId` mismatch (`organizationId: "org_other"` inside `/organizations/org_1/...`) -> `PERMISSION_DENIED`.
5. Oversized ID injection (`1500` chars) on document path -> `PERMISSION_DENIED`.
6. Ghost field injection on `/users/{uid}` (`isAdmin: true`) -> `PERMISSION_DENIED`.
7. Self-role escalation on `/users/{uid}` update (`role: "super_admin"`) -> `PERMISSION_DENIED`.
8. Mutating immutable `ownerId` on customer update -> `PERMISSION_DENIED`.
9. Mutating immutable `createdAt` on customer update -> `PERMISSION_DENIED`.
10. Blanket `list` query by another user without matching `ownerId` -> `PERMISSION_DENIED`.
11. Non-admin deleting an `audit_logs` record -> `PERMISSION_DENIED`.
12. Accessing an unlisted root collection `/shadow_data/item1` -> `PERMISSION_DENIED`.
