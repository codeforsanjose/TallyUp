# Introduction

Hello and welcome to the TallyUp project! We are excited to have you contribute to our project. This document outlines the guidelines for contributing, including how to report issues, submit code, and adhere to our coding standards.

# How to Contribute

1. [Reporting Issues](#reporting-issues)
2. [Suggesting Features](#suggesting-features)
3. [Submitting Code](#submitting-code)
4. [Coding Standards](#coding-standards)
5. [Testing Your Changes](#testing-your-changes)

## Reporting Issues

If you find a bug or have a question about the project, please open an issue on our [GitHub Issues page](https://github.com/codeforsanjose/tallyup/issues). When reporting an issue, please include:

- A clear description of the problem.
- Steps to reproduce the issue.
- Any relevant screenshots or logs.

## Suggesting Features

If you have an idea for a new feature or improvement, please open a feature request on our [GitHub Issues page](https://github.com/codeforsanjose/tallyup/issues). When suggesting a feature, please include:

- A clear description of the feature.
- The problem it solves or the value it adds.
- Any relevant examples or use cases.

## Submitting Code

If you want to contribute code, please follow these steps:

1. Fork the repository on GitHub.
2. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b my-feature-branch
   ```
3. Make your changes and commit them with a clear message:
   ```bash
   git commit -m "Add new feature or fix bug"
   ```
4. Push your changes to your fork:
   ```bash
   git push origin my-feature-branch
   ```
5. Open a pull request against the `main` branch of the original repository.
   - Ensure your pull request has a clear title and description.
   - Reference any related issues by using `#issue_number`.

## Coding Standards

We follow a set of coding standards to maintain code quality and consistency. Please adhere to the following guidelines when contributing code:

- Prefer functional programming paradigms.
  Use functional programming techniques where appropriate. Use immutability, pure functions, declarative constructs, and higher-order functions to enhance code clarity and maintainability.

- Prefer `unknown` over `any`.
  Use `unknown` instead of `any` to ensure type safety. This helps catch potential errors at compile time.

- Prefer `const` over `let`.
  Use `const` for variables that do not change. This helps prevent accidental reassignment and makes the code easier to reason about.

- Aggressively type helper and utility functions.
  All shared or reusable code, especially helpers and utility functions and types, should be fully typed at the definition site. This allows Typescript to correctly propogate types into consuming code despite having fewer type annotations in the consuming code.

```typescript
// Prefer this:
// utils.ts
type Handler = (event: Event) => Result;

export const buildHandler = (rawHandler: RawHandler): Handler => {
  // Adapter logic here
  return (event) => rawHandler(event);
};

// consumer.ts
const handler = buildHandler((event) => {
  // `event` is already typed
  return { success: true };
});
```

```typescript
// Avoid this:
// utils.ts
export const buildHandler = (rawHandler: RawHandler) => {
  return (event: Event) => rawHandler(event);
};

// consumer.ts
const handler = buildHandler((event: Event): Result => {
  // event and return type have to be re-specified here in the consuming code
  // In some cases, this can lead to type mismatches if the types change in the utility function.
  return { success: true };
});
```

### Prefer narrative functions over small helper functions.

Functions should be self-contained and focused on doing one thing well. While modular code is valuable, we prioritize clarity and maintainability in early development or exploratory phases. Treat a function like a "paragraph" in a document, and each operation within it like a "sentence."

Use descriptive names for functions and variables to make the code self-documenting.

Keep logic in one place unless there’s a strong DRY or readability reason to abstract.

Favor clarity and narrative flow over premature modularization.

Use inline comments sparingly to offer context where intent isn’t obvious.

Aim for functions that tell the whole story without sending readers chasing through multiple helper functions unless reuse or separation of concerns justifies it.

Example:

```typescript
// Contains all the necessary logic in as few places as possible, reads like a narrative. "Get the user, reset the password, update the user, and send an email."
const buildResetPassword =
  (
    // All the operations are in one place, typed as subsets of external libraries. This allows us to directly mock the libraries in tests rather than mocking a helper function that would've eventally led to a mock of the library.
    usersTable: Pick<typeof db.users, 'findById' | 'update'>,
    hasher: Pick<typeof hasherLib, 'hash'>,
    emailer: Pick<typeof emailService, 'sendEmail'> => Promise<void>,
  ) =>
  async (userId: string, newPassword: string) => {
    // Get user
    const user = await usersTable.findById(userId);
    if (!user) throw new Error('User not found');

    // Hash new password
    const hash = await hasher.hash(newPassword);

    // Update user password
    await usersTable.update(userId, { passwordHash: hash });

    // Send confirmation email
    await sendEmailFunc(user.email);
  };

  const resetPassword = buildResetPassword(db.users, hasherLib, emailService);
```

```typescript
// Industry standard, but not preferred in this codebase. This adds a layer of indirection that can make the code harder to follow, especially across multiple files.
const buildResetPassword =
  (
    getUser: (id: string) => Promise<User>,
    hashNewPassword: (pw: string) => Promise<string>,
    saveNewPassword: (id: string, hash: string) => Promise<void>,
    notifyUser: (email: string) => Promise<void>,
  ) =>
  async (userId: string, newPassword: string) => {
    const user = await getUser(userId);
    const hash = await hashNewPassword(newPassword);
    await saveNewPassword(user.id, hash);
    await notifyUser(user.email);
  };

const getUser = async (id: string, usersTable) => {
  /* ... */
};
const hashNewPassword = async (pw: string, hasher) => {
  /* ... */
};
const saveNewPassword = async (id: string, hash: string, usersTable) => {
  /* ... */
};
const notifyUser = async (email: string, sendEmailFunc) => {
  /* ... */
};

const resetPassword = buildResetPassword(getUser, hashNewPassword, saveNewPassword, notifyUser);
```

## Testing Your Changes

Before submitting your code, please ensure that you have tested your changes thoroughly. We use [Bun](https://bun.sh/) for running tests. To run the tests, use the following command:

```bash
bun run integration-tests
```

This will execute the integration tests and ensure that your changes do not break any existing functionality.
If you have added new features or made significant changes, please also add unit tests to cover your changes.

## Pre-PR Review Checklist

- [ ] Code adheres to the [coding standards](#coding-standards).
- [ ] All tests pass.
- [ ] No leftover debug code or immediate TODOs.
- [ ] Descriptive PR title.
