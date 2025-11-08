# Commit Message Linting Guide

This repository enforces commit message conventions using **commitlint** and **husky** git hooks.

## What Gets Validated?

Every commit message is automatically checked against the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Valid Commit Message Format

```
<type>(<scope>): <subject>
```

**Required:**
- `type`: One of the allowed types (see below)
- `subject`: Brief description of the change

**Optional:**
- `scope`: Area of codebase affected (e.g., `streaming`, `anthropic`, `core`)

## Allowed Commit Types

| Type | Description | Version Impact |
|------|-------------|----------------|
| `feat` | New feature | MINOR |
| `fix` | Bug fix | PATCH |
| `docs` | Documentation changes | PATCH |
| `style` | Code style (formatting, etc.) | PATCH |
| `refactor` | Code refactoring | PATCH |
| `perf` | Performance improvements | PATCH |
| `test` | Adding/updating tests | PATCH |
| `chore` | Maintenance tasks | PATCH |
| `build` | Build system changes | PATCH |
| `ci` | CI/CD changes | PATCH |
| `revert` | Reverting changes | PATCH |

## Validation Rules

### ✅ Valid Examples

```bash
feat: add streaming support
fix: resolve timeout issue
docs: update installation guide
feat(anthropic): add Claude 3.5 support
fix(streaming): handle connection drops
refactor(core)!: simplify API interface
```

### ❌ Invalid Examples

```bash
# ❌ No type
Updated the documentation

# ❌ Invalid type
Added: new feature

# ❌ Uppercase type
Feat: add support

# ❌ Subject ends with period
feat: add support.

# ❌ Subject too long (>100 chars)
feat: add this really long feature that does way too many things and should probably be split into multiple commits

# ❌ Empty subject
feat:

# ❌ Invalid scope format
feat(CORE): add feature
```

## What Happens When You Commit?

### 1. Pre-commit Hook
Before your commit is created, these checks run automatically:
- ✓ TypeScript type checking (`npm run typecheck`)
- ✓ ESLint code linting (`npm run lint`)

If either fails, the commit is **rejected**.

### 2. Commit-msg Hook
After you write your commit message, it is validated:
- ✓ Message format matches conventional commits
- ✓ Type is valid
- ✓ Subject is not empty
- ✓ Subject doesn't end with period
- ✓ Message length is acceptable

If validation fails, the commit is **rejected** with an error message.

## How to Create Valid Commits

### Option 1: Interactive Commit (Recommended)

Use the built-in commit wizard:

```bash
git add .
npm run commit
```

This guides you through:
1. Selecting commit type
2. Entering scope (optional)
3. Writing short description
4. Writing longer description (optional)
5. Noting breaking changes (optional)

### Option 2: Manual Commit

Write the commit message yourself:

```bash
git add .
git commit -m "feat: add new feature"
```

### Option 3: Multi-line Commit

For commits with body/footer:

```bash
git commit -m "feat: add streaming support" -m "" -m "Implemented server-sent events for real-time responses" -m "" -m "BREAKING CHANGE: old polling method removed"
```

Or use your editor:

```bash
git commit
# Opens editor for full commit message
```

## Breaking Changes

To indicate a breaking change (triggers MAJOR version bump):

### Option 1: Add `!` after type

```bash
feat!: change API interface
refactor!: rename method names
```

### Option 2: Add `BREAKING CHANGE:` in footer

```bash
feat: simplify configuration

BREAKING CHANGE: Configuration format has changed.
Old format no longer supported.
```

## Bypassing Hooks (Emergency Only)

In rare cases, you may need to bypass the hooks:

```bash
git commit --no-verify -m "emergency fix"
```

**Warning:** This should only be used in emergencies. Commits without proper format won't trigger correct version bumping in CI/CD.

## Troubleshooting

### "commit message does not match format"

**Problem:** Your commit message doesn't follow the convention.

**Solution:** Use `npm run commit` or check the format:
- Starts with valid type (`feat`, `fix`, etc.)
- Has colon and space after type/scope
- Has a subject
- Subject doesn't end with period

### "subject may not be empty"

**Problem:** No subject provided after the type.

**Solution:**
```bash
# ❌ Wrong
git commit -m "feat:"

# ✅ Correct
git commit -m "feat: add new feature"
```

### "type must be one of [feat, fix, ...]"

**Problem:** Invalid commit type used.

**Solution:** Use one of the allowed types listed above.

### "header must not be longer than 100 characters"

**Problem:** Commit message first line is too long.

**Solution:** Shorten the subject line, move details to body:

```bash
# ❌ Too long
git commit -m "feat: add support for streaming responses with automatic reconnection and error handling"

# ✅ Better
git commit -m "feat: add streaming with auto-reconnect" -m "Includes error handling and connection recovery"
```

### Pre-commit hooks fail

**Problem:** TypeScript errors or linting errors.

**Solution:** Fix the errors before committing:

```bash
# Check what's failing
npm run typecheck
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Then try committing again
git add .
npm run commit
```

## Configuration Files

The commit linting system uses these files:

- `.husky/commit-msg` - Git hook that runs commitlint
- `.husky/pre-commit` - Git hook that runs typecheck and lint
- `commitlint.config.js` - Commitlint rules configuration
- `package.json` - Commitizen configuration

## CI/CD Integration

The commit message format is also used in CI/CD:

1. When merged to `master`, commit messages are analyzed
2. Version bump type is determined automatically:
   - `BREAKING CHANGE` or `!` → MAJOR (1.0.0 → 2.0.0)
   - `feat:` → MINOR (1.0.0 → 1.1.0)
   - `fix:`, `docs:`, etc. → PATCH (1.0.0 → 1.0.1)
3. Package is published with new version

See [RELEASING.md](../RELEASING.md) for more details.

## Examples from Real Commits

### Feature Addition (Minor)
```
feat(streaming): add SSE support

Implemented server-sent events for real-time streaming responses.
Supports all three providers (OpenAI, Anthropic, Gemini).
```

### Bug Fix (Patch)
```
fix(anthropic): handle rate limit errors

Added exponential backoff retry logic for rate limit errors.
Fixes #123
```

### Breaking Change (Major)
```
refactor!: simplify client initialization

BREAKING CHANGE: Changed createClient to createAIClient.

Migration:
- Before: createClient('openai', { key: 'xxx' })
- After: createAIClient({ provider: 'openai', apiKey: 'xxx' })
```

### Documentation Update (Patch)
```
docs(readme): add streaming examples

Added code examples for streaming responses in README.
```

### Chore (Patch)
```
chore(deps): update dependencies

Updated all dependencies to latest versions.
No breaking changes.
```

## Getting Help

If you're stuck:

1. Use the interactive commit tool: `npm run commit`
2. Check the commit convention guide: [.github/COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md)
3. Review this linting guide
4. Look at recent commits for examples: `git log --oneline -10`

## Resources

- [Conventional Commits Spec](https://www.conventionalcommits.org/)
- [Commitlint Documentation](https://commitlint.js.org/)
- [Commitizen Documentation](https://commitizen-tools.github.io/commitizen/)
