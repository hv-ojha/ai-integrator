# Quick Start for Contributors

## Setup (First Time)

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/ai-integrator.git
cd ai-integrator

# 2. Install dependencies (sets up git hooks automatically)
npm install

# 3. Create a branch
git checkout -b feat/my-feature
```

## Daily Workflow

```bash
# Make changes
# ... edit files ...

# Validate changes
npm run validate

# Commit (use interactive tool)
git add .
npm run commit

# Or commit manually with conventional format
git commit -m "feat: add new feature"

# Push and create PR
git push origin feat/my-feature
```

## Commit Format Cheat Sheet

### Basic Format
```
<type>: <description>
```

### Common Types
- `feat` - New feature → MINOR version bump
- `fix` - Bug fix → PATCH version bump
- `docs` - Documentation → PATCH version bump
- `refactor` - Code refactoring → PATCH version bump
- `test` - Add/update tests → PATCH version bump
- `chore` - Maintenance → PATCH version bump

### Breaking Changes (MAJOR version bump)
```bash
# Option 1: Add ! after type
git commit -m "feat!: change API interface"

# Option 2: Add BREAKING CHANGE in body
git commit -m "feat: simplify config" -m "" -m "BREAKING CHANGE: config format changed"
```

### With Scope
```bash
git commit -m "feat(streaming): add SSE support"
git commit -m "fix(anthropic): handle rate limits"
```

## Common Commands

```bash
# Development
npm run dev              # Watch mode
npm run build            # Build package

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage

# Validation
npm run typecheck        # TypeScript check
npm run lint             # ESLint
npm run lint:fix         # Auto-fix lint issues
npm run validate         # All checks (typecheck + lint + test)

# Commits
npm run commit           # Interactive commit wizard
git commit -m "..."      # Manual commit (validated)
```

## Troubleshooting

### "Commit message does not match format"
Use the interactive tool: `npm run commit`

### "Type must be one of [feat, fix, ...]"
Use a valid type: feat, fix, docs, refactor, test, chore, build, ci, perf, revert

### "Subject may not be empty"
Add a description after the type:
```bash
# ❌ Wrong
git commit -m "feat:"

# ✅ Correct
git commit -m "feat: add streaming"
```

### Pre-commit hooks fail (typecheck/lint errors)
Fix the errors first:
```bash
npm run typecheck        # See type errors
npm run lint:fix         # Auto-fix lint issues
```

## What Happens After Merge?

When your PR is merged to `master`:

1. ✅ CI runs tests
2. 📦 Version is bumped automatically (based on commits)
3. 🚀 Package is published to npm
4. 📝 GitHub release is created
5. 💬 Your PR gets a comment with publish info

## Need More Help?

- **Detailed commit guide:** [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md)
- **Troubleshooting:** [COMMIT_LINT_GUIDE.md](./COMMIT_LINT_GUIDE.md)
- **Full contributing guide:** [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Release process:** [../RELEASING.md](../RELEASING.md)

---

Happy coding! 🚀
