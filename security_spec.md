# Security Specification for CRM Platform

## Data Invariants
1. **Customers**: Must be owned by a user. Only the owner can read/write.
2. **Tickets**: Linked to a customer. Only the owner of the customer can create/read/write the ticket.
3. **Comments**: Belong to a ticket. Access derived from the ticket's parent (customer).
4. **Campaigns**: Marketing data. Accessible by authenticated users.
5. **AI Insights**: System-generated. Read-only for users, write-only for system/admin.

## The "Dirty Dozen" Payloads
These payloads should be rejected by the security rules.

1. **Identity Spoofing**: Attempt to create a customer with someone else's `ownerId`.
2. **Unauthorized Read**: Attempt to read a customer profile without being the owner.
3. **Orphaned Ticket**: Create a ticket without a valid `customerId`.
4. **Priority Escalation**: Update a ticket's priority without being authorized (actually in this CRM, agents/owners can do it, but let's say a regular user shouldn't update others' tickets).
5. **PII Leak**: Querying for all user emails globally.
6. **System Field Injection**: Attempt to write to `ai/insights` from the client.
7. **Timestamp Fraud**: Setting `createdAt` to a future date instead of `request.time`.
8. **Resource Exhaustion**: Sending a 1MB string in the `name` field of a customer.
9. **Status Skipping**: Updating a ticket from `new` directly to `closed` without passing through `processing` (if we had state transition logic).
10. **ID Poisoning**: Using a 2KB string as a document ID.
11. **Malicious Comment**: Posting a comment to a ticket the user doesn't own.
12. **Affected Keys Bypass**: Trying to update `createdAt` on a customer.

## Red Team Conflict Report
| Collection | Identity Spoofing | State Shortcutting | Resource Poisoning |
|------------|-------------------|--------------------|-------------------|
| customers  | Blocked by `ownerId == auth.uid` | N/A | Blocked by `.size()` checks |
| tickets    | Blocked by parent check | N/A | Blocked by `.size()` checks |
| comments   | Blocked by ticket check | N/A | Blocked by `.size()` checks |
| campaigns  | Blocked by `isSignedIn` | N/A | Blocked by `.size()` checks |
| insights   | Blocked (Read Only) | N/A | Blocked (Read Only) |
