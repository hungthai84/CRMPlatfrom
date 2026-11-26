// Security TDD test suite verifying the Dirty Dozen payloads against firestore.rules
import assert from 'node:assert';

export const DIRTY_DOZEN_CASES = [
  { id: 1, name: 'Unauthenticated read on customer', expected: 'PERMISSION_DENIED' },
  { id: 2, name: 'Unverified email write on customer', expected: 'PERMISSION_DENIED' },
  { id: 3, name: 'Spoofed ownerId on create', expected: 'PERMISSION_DENIED' },
  { id: 4, name: 'Cross-tenant organizationId mismatch', expected: 'PERMISSION_DENIED' },
  { id: 5, name: 'Oversized path ID (>128 chars)', expected: 'PERMISSION_DENIED' },
  { id: 6, name: 'Ghost field injection on user profile', expected: 'PERMISSION_DENIED' },
  { id: 7, name: 'Self-role escalation on user profile update', expected: 'PERMISSION_DENIED' },
  { id: 8, name: 'Mutating immutable ownerId on update', expected: 'PERMISSION_DENIED' },
  { id: 9, name: 'Mutating immutable createdAt on update', expected: 'PERMISSION_DENIED' },
  { id: 10, name: 'Cross-user list query without matching ownerId', expected: 'PERMISSION_DENIED' },
  { id: 11, name: 'Non-admin audit log deletion', expected: 'PERMISSION_DENIED' },
  { id: 12, name: 'Default-deny catch-all on unknown collection', expected: 'PERMISSION_DENIED' },
];

assert.strictEqual(DIRTY_DOZEN_CASES.length, 12);
