# Firestore Security Specifications

## 1. Data Invariants
- **Verification Codes**: Can only be read/updated with matching lowercase email structure; verification records must maintain valid code fields.
- **Academic Programs & Registrations**: Only valid collections (students, trainers, groups, videos, certificates, applications, special_programs, special_enrollments) can receive data payloads. No arbitrary collection names are permitted.
- **Value Integrity**: ID structures must be checked to prevent resource hijacking and malicious injection.

## 2. The "Dirty Dozen" Payloads (Adversarial Testing)
1. Verification code injection with empty code.
2. Verification code document creation with extremely long size (over limit).
3. Student document bypass (malicious ID structure).
4. Unregulated writes to system settings document `supervisor_pin`.
5. Forging a trainer registration as pre-approved.
6. Forging negative or infinite points for groups.
7. Spoofing or manipulating user roles in private profiles.
8. Injecting invalid data types in settings documents.
9. Blanketing read scans of the entire collections structure.
10. Creating video comments with missing timestamp identifiers.
11. Bypassing state lock on application status.
12. Attempting database resource exhaustion using long, nested properties.

## 3. Test Cases Validation (Reflects expected test runner outcomes)
The ruleset will block the above dirty payloads through strict path limits, format checks, and structural safeguards.
