# Security Specification - RevaDetail CRM

## Data Invariants
1. **Customers**: Must have an `ownerId` matching the authenticated user's UID.
2. **Tickets**: Must have an `ownerId` matching the creator's UID.
3. **Omnichannel Threads**: Access restricted to the `ownerId` or assigned `agentId`.
4. **Campaigns**: Owned by the creator.
5. **Insights**: System-generated, but viewable by authenticated users in the organization.

## The "Dirty Dozen" Payloads (Attack Vectors)
1. **Identity Spoofing**: Attempt to create a customer with someone else's `ownerId`.
2. **ID Poisoning**: Use a 1MB string as a `customerId`.
3. **Privilege Escalation**: Non-admin user trying to write to `admins` collection.
4. **PII Leak**: Non-owner trying to `get` another user's customer profile.
5. **Shadow Field Injection**: Adding an `isAdmin: true` field to a customer document.
6. **Orphaned Record**: Creating a ticket for a non-existent customer.
7. **Timestamp Spoofing**: Setting `createdAt` to a future date instead of `request.time`.
8. **Unverified Access**: User with `email_verified: false` trying to write data.
9. **Query Scraping**: Authenticated user trying to `list` all customers without a `where` clause (rejected by rule).
10. **Immutable Field Change**: Attempting to change `createdAt` on update.
11. **State Shortcut**: Changing a ticket status from `new` to `closed` without required agent notes.
12. **Recursive Cost Attack**: Forcing 10 `get()` calls in a single rule evaluation.

## Test Runner (Logic Verification)
See `firestore.rules.test.ts` for implementation of these checks.
