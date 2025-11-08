# Installation Guide

## Quick Setup

### 1. Install Dependencies

Due to a known issue with some transitive dependencies, use this command to install:

```bash
npm install --ignore-scripts --legacy-peer-deps
```

**Why these flags?**
- `--ignore-scripts`: Skips problematic postinstall scripts in some dependencies
- `--legacy-peer-deps`: Ensures compatibility with peer dependencies

### 2. Verify Installation

```bash
# Type check
npm run typecheck

# Build the package
npm run build

# Run tests (when implemented)
npm test
```

## Alternative: Using Yarn or PNPM

If you prefer other package managers:

### Yarn

```bash
yarn install
```

### PNPM

```bash
pnpm install --no-optional
```

## Development Workflow

```bash
# Watch mode for development
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Run tests
npm test

# Coverage report
npm run test:coverage

# Validate everything (typecheck + lint + test)
npm run validate
```

## Build Output

After building, you'll see:

```
dist/
├── index.js        # CommonJS bundle (~13.4KB minified, 3.5KB gzipped)
├── index.mjs       # ESM bundle (~13.3KB minified, 3.5KB gzipped)
├── index.d.ts      # TypeScript declarations
└── index.d.mts     # ESM TypeScript declarations
```

## Common Issues

### Issue: `patch-package` not found

**Solution**: Use the install command with `--ignore-scripts`:

```bash
npm install --ignore-scripts --legacy-peer-deps
```

### Issue: Peer dependency warnings

These are normal! The package uses peer dependencies for provider SDKs to keep the bundle small.

### Issue: TypeScript errors after install

**Solution**: Run a clean build:

```bash
npm run typecheck
npm run build
```

## Package Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build the package for distribution |
| `npm run dev` | Watch mode for development |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run lint` | Lint source code |
| `npm run typecheck` | Check TypeScript types |
| `npm run validate` | Run all checks (typecheck + lint + test) |

## System Requirements

- **Node.js**: 18.0.0 or higher
- **npm**: 7.0.0 or higher (comes with Node.js)
- **TypeScript**: 5.3+ (included as dev dependency)

## Next Steps

1. ✅ Install dependencies
2. ✅ Run `npm run build` to verify everything works
3. ✅ Run `npm test` to run the test suite
4. ✅ Start developing or using the package!

## Support

If you encounter any issues:

1. Clear npm cache: `npm cache clean --force`
2. Delete `node_modules` and `package-lock.json`
3. Reinstall: `npm install --ignore-scripts --legacy-peer-deps`

For persistent issues, please open an issue on GitHub.

---

**Installation successful?** You're ready to start using @ai-integrator/core! 🚀
