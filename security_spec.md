# Firestore Security Specification - INFINITIUM Society

## Data Invariants
1. **Public Read Access**: All collections (`about`, `gallery`, `achievements`, `members`) are publicly readable to allow visitors to see society information.
2. **Restricted Write Access**: Only authenticated administrators can create, update, or delete documents.
3. **Identity Integrity**: For update operations, immutable fields like `createdAt` must not be changed.
4. **Schema Validation**: All incoming data must strictly match the schemas defined in `firebase-blueprint.json`.

## The "Dirty Dozen" (Malicious Payloads)
These payloads must be rejected by the security rules:

1. **Unauthenticated Write**: Attempting to add an achievement without being logged in.
2. **Identity Spoofing**: Attempting to set an `ownerId` (if we had one) to another user.
3. **ID Poisoning**: Creating a gallery item with a document ID that is 1MB in size.
4. **Shadow Update**: Updating a member with an extra field `isVerified: true` that doesn't exist in the schema.
5. **PII Leak**: If we had user emails, trying to read a private `info` subcollection as a guest.
6. **Token/Role Escalation**: Attempting to update the `role` of a member document to "Admin" if it's a restricted field (though here it's team role, not system role).
7. **Type Poisoning**: Sending a number for a member's `name`.
8. **Resource Exhaustion**: Sending a 5MB string for a gallery `description`.
9. **Relational Orphan**: Creating a member for a tenure that doesn't exist (if we had a tenures collection).
10. **Terminal State Bypass**: If we had a "FEST_STATUS: COMPLETED", trying to change it back to "ACTIVE".
11. **Timestamp Spoofing**: Sending a client-side date for `createdAt` instead of `request.time`.
12. **Array Injection**: Injecting 10,000 tags into a list to crash the UI.

## Test Runner (Logic Verification)
The `firestore.rules.test.ts` will verify these constraints. (Skipping actual test file creation as I don't have a test runner in this environment, but logic will be followed in rules).
