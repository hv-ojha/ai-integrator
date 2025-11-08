# Pull Request Guidelines

## Overview

All pull requests are automatically validated before they can be merged. This ensures code quality and consistency across the project.

## Automated Checks

When you open or update a PR, the following checks run automatically:

### 1. PR Title Validation ✅

**What it checks:**
- PR title must follow [Conventional Commits](https://www.conventionalcommits.org/) format
- Format: `<type>: <description>` or `<type>(<scope>): <description>`

**Valid PR titles:**
```
feat: Add streaming support
fix: Resolve timeout issue
docs: Update installation guide
feat(anthropic): Add Claude 3.5 support
```

**Invalid PR titles:**
```
❌ Added streaming support         (No type prefix)
❌ feat:add streaming support      (Missing space after colon)
❌ FEAT: add streaming support     (Type must be lowercase)
❌ update docs                      (No type prefix)
```

**Allowed types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding/updating tests
- `chore` - Maintenance tasks
- `build` - Build system changes
- `ci` - CI/CD changes
- `revert` - Reverting changes

### 2. Commit Message Validation ✅

**What it checks:**
- All commits in the PR follow conventional commit format
- Each commit has a valid type
- Commit subjects are properly formatted

**How to fix:**
If your commits don't follow the format, you have two options:

**Option A: Squash merge (Recommended)**
- When merging, use "Squash and merge"
- GitHub will combine all commits into one
- Ensure the squash commit message follows the format

**Option B: Rewrite commit history**
```bash
# Interactive rebase to rewrite commits
git rebase -i HEAD~3  # Rewrite last 3 commits

# Amend the most recent commit message
git commit --amend -m "feat: add new feature"

# Force push (only if you own the branch)
git push --force-with-lease
```

### 3. Code Quality Checks ✅

**What it checks:**
- TypeScript type checking (no errors)
- ESLint linting (no errors)
- All tests pass
- Test coverage meets requirements

**Runs on:**
- Node.js 18.x
- Node.js 20.x

**How to run locally:**
```bash
npm run validate
```

This runs:
```bash
npm run typecheck  # TypeScript check
npm run lint       # ESLint
npm test           # All tests
```

### 4. Build Validation ✅

**What it checks:**
- Package builds successfully
- Bundle files are created
- Bundle size is acceptable (<20KB per file)

**How to run locally:**
```bash
npm run build
```

### 5. Bundle Size Report 📊

After a successful build, a comment is posted on your PR showing:
- CJS bundle size
- ESM bundle size
- Warning if size exceeds 20KB threshold

**Example:**
```
## ✅ Bundle Size Report

| Format | Size |
|--------|------|
| CJS    | 8 KB |
| ESM    | 7 KB |

✅ Bundle size is within acceptable limits
```

## PR Templates

When creating a PR, you can choose from specialized templates:

### Available Templates

1. **Default Template** - General purpose PR template
2. **Bug Fix Template** - For bug fixes with reproduction steps
3. **Feature Template** - For new features with detailed planning
4. **Documentation Template** - For documentation updates
5. **Performance Template** - For performance improvements with benchmarks

### How to Use Templates

**Automatic Template Selection:**

When you create a PR, you'll see a template chooser with clickable links:

1. **Open the PR creation page**
2. **See the template chooser** at the top
3. **Click the link** for the template you need:
   - 🐛 Bug Fix Template
   - ✨ Feature Template
   - 📝 Documentation Template
   - ⚡ Performance Template
   - 🔧 General Template (default)

4. **Template loads automatically** - no need to modify URLs!

**Manual Template Selection (Alternative):**

If you prefer, you can manually select a template by adding `?template=name.md` to the PR URL:

```
https://github.com/hv-ojha/ai-integrator/compare/master...branch?template=bug_fix.md
```

Available templates:
- `bug_fix.md`
- `feature.md`
- `documentation.md`
- `performance.md`

## PR Workflow

### 1. Create Your PR

```bash
# Push your branch
git push origin feat/my-feature

# Open PR on GitHub
# Select appropriate template (or use default)
```

### 2. Automated Checks Run

The PR validation workflow automatically:
- ✓ Validates PR title
- ✓ Checks all commit messages
- ✓ Runs type checking, linting, and tests
- ✓ Builds the package
- ✓ Reports bundle size

### 3. Review Results

**All checks pass:**
```
✅ PR Ready to Merge

All validation checks have passed:
- ✅ PR title follows conventional commits
- ✅ All commit messages are valid
- ✅ Type checking passed
- ✅ Linting passed
- ✅ All tests passed
- ✅ Build successful

This PR is ready to be reviewed and merged! 🚀
```

**Some checks fail:**
```
❌ PR Validation Failed

The following checks need to pass before this PR can be merged:
- ❌ PR Title Check
- ❌ Commit Message Check

Please fix the issues and push again.
```

### 4. Fix Issues (if needed)

If checks fail:

1. **Read the error messages** in the Actions tab
2. **Fix the issues** locally
3. **Push your changes**
4. **Checks run automatically** again

### 5. Get Reviewed

Once all checks pass:
- Request review from maintainers
- Address any feedback
- Maintainer approves and merges

## Common Issues & Solutions

### ❌ PR Title Invalid

**Problem:**
```
The subject "add new feature" found in the pull request title
"add new feature" didn't match the configured pattern.
```

**Solution:**
Edit your PR title to follow conventional commits:
```
feat: Add new feature
```

### ❌ Commit Messages Invalid

**Problem:**
```
✖ subject may not be empty [subject-empty]
✖ type may not be empty [type-empty]
```

**Solution:**
Your commits don't follow conventional format. Either:
1. Plan to use "Squash and merge" with a proper message
2. Rewrite commit messages using `git rebase -i`

### ❌ Type Errors

**Problem:**
```
src/providers/openai.ts:42:15 - error TS2322: Type 'string' is not assignable to type 'number'.
```

**Solution:**
```bash
# Check types locally
npm run typecheck

# Fix the errors
# Then commit and push
```

### ❌ Lint Errors

**Problem:**
```
/home/runner/work/ai-integrator/src/index.ts
  42:15  error  'foo' is never used  @typescript-eslint/no-unused-vars
```

**Solution:**
```bash
# Auto-fix linting issues
npm run lint:fix

# Or check manually
npm run lint

# Commit fixes
git add .
git commit -m "style: fix linting errors"
git push
```

### ❌ Test Failures

**Problem:**
```
FAIL  tests/providers/openai.test.ts
  ● OpenAI Provider › should handle errors
```

**Solution:**
```bash
# Run tests locally
npm test

# Or watch mode for development
npm run test:watch

# Fix failing tests
# Commit and push
```

### ⚠️ Bundle Size Warning

**Problem:**
```
⚠️ Warning: Bundle size exceeds 20KB threshold
```

**Solution:**
- Review what was added
- Look for ways to optimize
- Consider if the size increase is justified
- Discuss with maintainers

## Tips for Success

### ✅ Before Opening PR

```bash
# Run all checks locally
npm run validate

# Ensure build works
npm run build

# Check commit messages
git log --oneline -5
```

### ✅ Good PR Practices

1. **One feature/fix per PR**
   - Makes review easier
   - Easier to revert if needed

2. **Write clear PR descriptions**
   - What does this PR do?
   - Why is it needed?
   - How was it tested?

3. **Keep PRs small**
   - Easier to review
   - Faster to merge
   - Less likely to have conflicts

4. **Update tests**
   - Add tests for new features
   - Update tests for bug fixes

5. **Update documentation**
   - Update README if needed
   - Add JSDoc comments
   - Update CHANGELOG (if required)

### ✅ Using PR Templates Effectively

**For Bug Fixes:**
- Use the `bug_fix.md` template
- Include reproduction steps
- Show before/after behavior
- Add regression tests

**For New Features:**
- Use the `feature.md` template
- Explain use cases
- Provide API examples
- Document design decisions

**For Documentation:**
- Use the `documentation.md` template
- Verify all examples work
- Check for broken links
- Ensure clear language

**For Performance:**
- Use the `performance.md` template
- Include benchmark results
- Show profiling data
- Justify trade-offs

**For Everything Else:**
- Use the default `pull_request_template.md`
- Fill out all relevant sections
- Remove sections that don't apply

## After PR is Merged

When your PR is merged to `master`:

1. ✅ **Automated version bump** based on commit type
2. ✅ **Package published** to npm automatically
3. ✅ **GitHub release** created with notes
4. 💬 **PR commented** with publish details

See [RELEASING.md](./RELEASING.md) for more details.

## Need Help?

- Check [CONTRIBUTING.md](./CONTRIBUTING.md) for general guidelines
- Read [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md) for commit format
- See [QUICK_START.md](./QUICK_START.md) for development setup
- Ask in GitHub Issues for questions

---

**Remember:** All these checks exist to maintain code quality and make the project better for everyone! 🚀
