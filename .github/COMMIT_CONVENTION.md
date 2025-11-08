# Commit Convention

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification for automatic versioning.

**Commit messages are enforced!** Invalid commits will be rejected by git hooks.

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Quick Commit (Interactive)

Use the interactive commit tool to ensure proper formatting:

```bash
npm run commit
# or
git add .
npx git-cz
```

This will guide you through creating a properly formatted commit message.

## Types and Version Bumping

The commit type determines which version number gets bumped:

### PATCH (0.0.X) - Bug fixes and minor changes
- `fix:` - Bug fixes
- `docs:` - Documentation updates
- `style:` - Code style changes (formatting, semicolons, etc.)
- `refactor:` - Code refactoring without changing functionality
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks, dependency updates

### MINOR (0.X.0) - New features (backwards compatible)
- `feat:` - New features
- `feat!:` - New features with breaking changes (becomes MAJOR)

### MAJOR (X.0.0) - Breaking changes
- Any commit with `BREAKING CHANGE:` in footer
- Any commit with `!` after type (e.g., `feat!:`, `refactor!:`)

## Examples

### Patch Release (0.1.0 → 0.1.1)
```
fix: resolve timeout issue with streaming responses

Fixed a bug where streaming responses would timeout after 30 seconds.
Now respects the configured timeout value.
```

### Minor Release (0.1.1 → 0.2.0)
```
feat: add support for custom headers

Added ability to pass custom headers to AI provider requests.

Example:
const client = createAIClient({
  provider: 'openai',
  headers: { 'X-Custom': 'value' }
});
```

### Major Release (0.2.0 → 1.0.0)
```
feat!: change default streaming behavior

BREAKING CHANGE: Streaming is now disabled by default.
To enable streaming, explicitly set stream: true in request options.

Migration:
- Before: const response = await client.complete(prompt);
- After: const response = await client.complete(prompt, { stream: true });
```

or

```
refactor: simplify API interface

BREAKING CHANGE: The createClient function has been renamed to createAIClient
and the configuration structure has changed.

Old:
createClient('openai', { key: 'xxx' })

New:
createAIClient({ provider: 'openai', apiKey: 'xxx' })
```

## Scopes (Optional)

You can add a scope to provide more context:

- `feat(streaming):` - Feature related to streaming
- `fix(anthropic):` - Fix for Anthropic provider
- `docs(readme):` - README documentation update
- `refactor(core):` - Core refactoring

## Tips

1. **First line < 72 characters**: Keep the subject line concise
2. **Use imperative mood**: "add" not "added" or "adds"
3. **Don't end with period**: Subject line shouldn't end with `.`
4. **Separate subject from body**: Use blank line
5. **Explain what and why**: Body should explain what changed and why

## Automated Process

When you push to `master`/`master`:

1. CI runs tests and validation
2. Workflow analyzes commit messages since last tag
3. Determines version bump type automatically:
   - BREAKING CHANGE or `!` → MAJOR
   - `feat:` → MINOR
   - Everything else → PATCH
4. Bumps version in package.json
5. Creates git tag
6. Publishes to npm
7. Creates GitHub release with bundle size info
8. Comments on related PRs

## Skipping CI

If you need to skip the publish workflow:

```
chore: update dependencies [skip ci]
```

Note: Version bump commits automatically include `[skip ci]` to avoid loops.
