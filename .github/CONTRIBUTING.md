# Contributing to @ai-integrator/core

Thank you for your interest in contributing! This guide will help you get started.

## Table of Contents

- [Development Setup](#development-setup)
- [Commit Guidelines](#commit-guidelines)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Git

### Setup Steps

1. **Fork the repository** on GitHub

2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-integrator.git
   cd ai-integrator
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

   This will also set up git hooks automatically via husky.

4. **Create a feature branch:**
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

5. **Start development:**
   ```bash
   npm run dev  # Watch mode for development
   ```

## Commit Guidelines

**⚠️ IMPORTANT: This repository enforces commit message conventions using git hooks.**

Every commit must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Two Ways to Commit

#### Option 1: Interactive Commit (Recommended)

Use the built-in commit wizard:

```bash
git add .
npm run commit
```

This will guide you through creating a properly formatted commit.

#### Option 2: Manual Commit

Write the commit message yourself:

```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve timeout issue"
git commit -m "docs: update installation guide"
```

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Allowed types:**
- `feat` - New feature (triggers MINOR version bump)
- `fix` - Bug fix (triggers PATCH version bump)
- `docs` - Documentation changes
- `style` - Code style changes
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding/updating tests
- `chore` - Maintenance tasks
- `build` - Build system changes
- `ci` - CI/CD changes

**Breaking changes:**
- Add `!` after type: `feat!: change API`
- Or add footer: `BREAKING CHANGE: description`
- Triggers MAJOR version bump

### What Gets Validated?

When you try to commit, these checks run automatically:

1. **Pre-commit hook:**
   - TypeScript type checking
   - ESLint linting

2. **Commit-msg hook:**
   - Commit message format
   - Valid type
   - Non-empty subject
   - Subject doesn't end with period
   - Message length limits

If any check fails, the commit is **rejected**.

### Examples

✅ **Valid commits:**
```bash
feat: add streaming support
fix: resolve memory leak
docs: update API reference
feat(anthropic): add Claude 3.5 support
fix(streaming)!: change stream format
refactor: simplify error handling

BREAKING CHANGE: Error format has changed
```

❌ **Invalid commits:**
```bash
Added new feature          # Missing type
Feat: new feature         # Type must be lowercase
feat: add feature.        # Subject ends with period
feat:                     # Empty subject
update: something         # Invalid type
```

### Troubleshooting

See [COMMIT_LINT_GUIDE.md](./COMMIT_LINT_GUIDE.md) for detailed troubleshooting.

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Type Checking

```bash
npm run typecheck
```

### Run Linting

```bash
npm run lint
```

### Run All Validations

```bash
npm run validate
```

This runs typecheck + lint + tests. **Always run this before submitting a PR.**

## Pull Request Process

### Before Submitting

1. **Ensure all tests pass:**
   ```bash
   npm run validate
   ```

2. **Ensure build works:**
   ```bash
   npm run build
   ```

3. **Use conventional commits** for all your commits

4. **Update documentation** if needed

5. **Add tests** for new features

### Submitting Your PR

1. **Push your branch:**
   ```bash
   git push origin feat/your-feature-name
   ```

2. **Open a Pull Request** on GitHub to the `master` branch

3. **Write a clear PR description:**
   - What does this PR do?
   - Why is this change needed?
   - How was it tested?
   - Any breaking changes?

4. **Automated checks will run:**
   - PR title validation
   - Commit message validation
   - Type checking, linting, tests
   - Build validation
   - Bundle size check

5. **Wait for all checks to pass** (see [PR_GUIDELINES.md](./PR_GUIDELINES.md))

6. **Address review feedback** if any

### PR Title Format

**IMPORTANT:** PR titles are automatically validated and must follow conventional commit format:

```
feat: add streaming support
fix: resolve timeout issue
docs: improve installation guide
```

When squash-merging, this becomes the commit message that determines versioning.

**See [PR_GUIDELINES.md](./PR_GUIDELINES.md) for detailed PR requirements and validation.**

## Release Process

**Releases are fully automated.** You don't need to manually bump versions or publish to npm.

### How It Works

1. **Your PR is merged** to `master`

2. **CI analyzes commits** since last release

3. **Version is bumped** automatically:
   - `BREAKING CHANGE` or `!` → MAJOR (1.0.0 → 2.0.0)
   - `feat:` → MINOR (1.0.0 → 1.1.0)
   - `fix:`, `docs:`, etc. → PATCH (1.0.0 → 1.0.1)

4. **Package is published** to npm

5. **GitHub release is created** with bundle size info

6. **Your PR is commented** with publish details

See [RELEASING.md](../RELEASING.md) for more details.

## Development Workflow

### Adding a New Feature

```bash
# 1. Create feature branch
git checkout -b feat/my-awesome-feature

# 2. Make changes
# ... edit files ...

# 3. Run tests
npm run validate

# 4. Commit with proper format
git add .
npm run commit
# Select "feat", enter description, etc.

# 5. Push and create PR
git push origin feat/my-awesome-feature
```

### Fixing a Bug

```bash
# 1. Create fix branch
git checkout -b fix/issue-123

# 2. Make changes
# ... fix the bug ...

# 3. Add tests
# ... add regression test ...

# 4. Run tests
npm run validate

# 5. Commit
git add .
git commit -m "fix: resolve issue with timeout handling

Fixes #123"

# 6. Push and create PR
git push origin fix/issue-123
```

### Updating Documentation

```bash
# 1. Create docs branch
git checkout -b docs/improve-readme

# 2. Update docs
# ... edit README.md ...

# 3. Commit
git commit -m "docs: improve installation instructions"

# 4. Push and create PR
git push origin docs/improve-readme
```

## Code Style

- **TypeScript:** Full type safety, no `any` unless absolutely necessary
- **ESLint:** Follow the existing ESLint configuration
- **Formatting:** Run `npm run lint:fix` to auto-fix issues
- **Comments:** Add JSDoc comments for public APIs
- **Tests:** Write tests for all new features and bug fixes

## Need Help?

- **Commit message issues?** See [COMMIT_LINT_GUIDE.md](./COMMIT_LINT_GUIDE.md)
- **Release questions?** See [RELEASING.md](../RELEASING.md)
- **General questions?** Open a [GitHub Discussion](https://github.com/hv-ojha/ai-integrator/discussions)
- **Found a bug?** Open an [Issue](https://github.com/hv-ojha/ai-integrator/issues)

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build something great together.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to @ai-integrator/core! 🚀
