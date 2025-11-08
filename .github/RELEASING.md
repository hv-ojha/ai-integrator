# Release Process

This document describes the automated release process for @ai-integrator/core.

## Overview

Releases are **fully automated** when code is merged to the `main` or `master` branch. You don't need to manually bump versions or publish to npm.

## How It Works

### 1. Automatic Version Bumping

Version bumps are determined by commit message conventions:

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
  - Commits with `BREAKING CHANGE:` in footer
  - Commits with `!` after type (e.g., `feat!:`, `refactor!:`)

- **MINOR** (1.0.0 → 1.1.0): New features
  - Commits starting with `feat:`

- **PATCH** (1.0.0 → 1.0.1): Bug fixes and improvements
  - `fix:`, `docs:`, `chore:`, `refactor:`, `perf:`, etc.

See [.github/COMMIT_CONVENTION.md](.github/COMMIT_CONVENTION.md) for detailed commit message guidelines.

### 2. Automated Workflow

When a PR is merged to master/master:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Tests Run                                                 │
│    ├─ Type checking                                          │
│    ├─ Linting                                                │
│    ├─ Unit tests                                             │
│    └─ Build validation                                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Version Analysis                                          │
│    ├─ Analyze commits since last tag                        │
│    ├─ Determine version bump type                           │
│    └─ Skip if this is already a version commit              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Version Bump                                              │
│    ├─ Update package.json                                   │
│    ├─ Create git tag (e.g., v1.2.3)                         │
│    └─ Push tag to repository                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Build & Publish                                           │
│    ├─ Build package (tsup)                                  │
│    ├─ Calculate bundle sizes                                │
│    └─ Publish to npm registry                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Create Release                                            │
│    ├─ Create GitHub release                                 │
│    ├─ Add bundle size info                                  │
│    └─ Comment on related PRs                                │
└─────────────────────────────────────────────────────────────┘
```

## Setup Requirements

### GitHub Repository Settings

1. **NPM Token** (Required)
   ```bash
   # Generate an npm token with publish permissions
   npm login
   npm token create

   # Add as GitHub secret: NPM_TOKEN
   # Repository Settings → Secrets → Actions → New repository secret
   ```

2. **GitHub Token** (Automatic)
   - `GITHUB_TOKEN` is automatically provided by GitHub Actions
   - Ensure workflow has necessary permissions (set in workflow file)

3. **Protected Branch Rules** (Recommended)
   - Settings → Branches → Add rule for `master`/`master`
   - ✓ Require pull request before merging
   - ✓ Require status checks to pass (Tests, Build)
   - ✓ Require conversation resolution before merging

### Local Development

1. **Use Conventional Commits**
   ```bash
   git commit -m "feat: add new streaming mode"
   git commit -m "fix: resolve memory leak"
   git commit -m "docs: update installation guide"
   ```

2. **Test Before Merging**
   ```bash
   npm run validate  # Runs typecheck, lint, and tests
   npm run build     # Verify build works
   ```

## Manual Override (Emergency)

If you need to publish manually:

```bash
# 1. Ensure you're on master and up to date
git checkout master
git pull origin master

# 2. Bump version manually
npm version patch  # or minor, major
npm version minor
npm version major

# 3. Build and publish
npm run build
npm publish --access public

# 4. Push tags
git push origin master --tags
```

## Monitoring Releases

### GitHub Actions
- View workflow runs: Repository → Actions → Publish to NPM
- Check logs for build/publish status
- Monitor bundle size trends

### NPM Package
- Package page: https://www.npmjs.com/package/@ai-integrator/core
- Download stats: https://npm-stat.com/charts.html?package=@ai-integrator/core

### GitHub Releases
- All releases: Repository → Releases
- Each release includes:
  - Version number
  - Bundle sizes (CJS, ESM, Package)
  - Commit history
  - Download links

## Troubleshooting

### Publish Fails

**Check NPM Token:**
```bash
# Verify token is set in GitHub Secrets
# Repository Settings → Secrets → Actions → NPM_TOKEN
```

**Check Package Name:**
```json
// package.json - must match npm registry
{
  "name": "@ai-integrator/core"
}
```

### Version Conflict

If version already exists on npm:
```bash
# Check current npm version
npm view @ai-integrator/core version

# Check local version
cat package.json | grep version

# Manually bump if needed
npm version patch --force
git push origin master --tags
```

### Tests Failing in CI

```bash
# Run locally first
npm run validate

# Check Node version matches CI (.nvmrc)
node --version  # should be 20.x

# Clear cache and retry
rm -rf node_modules package-lock.json
npm install
npm run validate
```

## Best Practices

1. **Squash and Merge PRs**: Use proper commit message in squash
2. **Test Locally First**: Run `npm run validate` before pushing
3. **Write Good Commit Messages**: Follow conventional commits
4. **Review Bundle Size**: Check GitHub release notes after publish
5. **Monitor NPM**: Ensure package appears within a few minutes

## Examples

### Feature Release (Minor)
```bash
# PR: Add support for Claude 3.5
# Commit: feat: add Claude 3.5 Sonnet support

# Result:
# - Version: 1.2.0 → 1.3.0
# - Tag: v1.3.0
# - Published: @ai-integrator/core@1.3.0
```

### Bug Fix (Patch)
```bash
# PR: Fix timeout handling
# Commit: fix: properly handle request timeouts

# Result:
# - Version: 1.3.0 → 1.3.1
# - Tag: v1.3.1
# - Published: @ai-integrator/core@1.3.1
```

### Breaking Change (Major)
```bash
# PR: Simplify API
# Commit: refactor!: simplify provider configuration
#
# BREAKING CHANGE: Changed createClient to createAIClient

# Result:
# - Version: 1.3.1 → 2.0.0
# - Tag: v2.0.0
# - Published: @ai-integrator/core@2.0.0
```

## Version History

To see all versions:
```bash
# Git tags
git tag -l

# NPM versions
npm view @ai-integrator/core versions

# GitHub releases
# Visit: https://github.com/hv-ojha/ai-integrator/releases
```
