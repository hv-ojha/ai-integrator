# Documentation Index

Welcome to the @ai-integrator/core documentation! This index helps you find the right documentation for your needs.

## 📚 Documentation Structure

### For Users (Root Directory)

**Getting Started**
- [README.md](../README.md) - Main package documentation, features, and usage examples
- [INSTALLATION.md](../INSTALLATION.md) - Installation instructions and setup
- [CHANGELOG.md](../CHANGELOG.md) - Version history and changes

### For Contributors (.github Directory)

**Contributing to the Project**
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Complete contributor guide
- [QUICK_START.md](./QUICK_START.md) - Quick reference for developers
- [TESTING.md](./TESTING.md) - Testing guide and best practices
- [TEST_SUMMARY.md](./TEST_SUMMARY.md) - Current test coverage and results

**Commit & Release Process**
- [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md) - Commit message format and versioning rules
- [COMMIT_LINT_GUIDE.md](./COMMIT_LINT_GUIDE.md) - Commit validation and troubleshooting
- [PR_GUIDELINES.md](./PR_GUIDELINES.md) - Pull request requirements and validation
- [RELEASING.md](./RELEASING.md) - Automated release process
- [WORKFLOW_DIAGRAM.md](./WORKFLOW_DIAGRAM.md) - Visual workflow diagrams

**PR Templates**
- [pull_request_template.md](./pull_request_template.md) - Default PR template
- [PULL_REQUEST_TEMPLATE/bug_fix.md](./PULL_REQUEST_TEMPLATE/bug_fix.md) - Bug fix template
- [PULL_REQUEST_TEMPLATE/feature.md](./PULL_REQUEST_TEMPLATE/feature.md) - Feature template
- [PULL_REQUEST_TEMPLATE/documentation.md](./PULL_REQUEST_TEMPLATE/documentation.md) - Documentation template
- [PULL_REQUEST_TEMPLATE/performance.md](./PULL_REQUEST_TEMPLATE/performance.md) - Performance template

**Technical Documentation**
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Project architecture and technical overview
- [STATUS.md](./STATUS.md) - Current implementation status and roadmap

## 🚀 Quick Navigation

### I want to...

**Use the package**
→ Start with [README.md](../README.md) for usage examples
→ Check [INSTALLATION.md](../INSTALLATION.md) for setup

**Contribute code**
→ Read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines
→ Check [QUICK_START.md](./QUICK_START.md) for quick setup

**Make a commit**
→ Use `npm run commit` for interactive commits
→ Or read [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md) for format

**Fix commit errors**
→ Check [COMMIT_LINT_GUIDE.md](./COMMIT_LINT_GUIDE.md)

**Understand the release process**
→ Read [RELEASING.md](./RELEASING.md)
→ See [WORKFLOW_DIAGRAM.md](./WORKFLOW_DIAGRAM.md) for visual flow

**Write tests**
→ Read [TESTING.md](./TESTING.md)
→ Check [TEST_SUMMARY.md](./TEST_SUMMARY.md) for current coverage

**Understand the architecture**
→ Read [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)
→ Check [STATUS.md](./STATUS.md) for implementation status

## 📂 File Organization

```
ai-integrator/
├── README.md                    # Main documentation (USER-FACING)
├── INSTALLATION.md              # Installation guide (USER-FACING)
├── CHANGELOG.md                 # Version history (USER-FACING)
│
├── .github/                     # All contributor/process documentation
│   ├── DOCS.md                 # This file - documentation index
│   ├── CONTRIBUTING.md         # Contributor guide
│   ├── QUICK_START.md          # Quick reference
│   ├── COMMIT_CONVENTION.md    # Commit format
│   ├── COMMIT_LINT_GUIDE.md    # Commit troubleshooting
│   ├── WORKFLOW_DIAGRAM.md     # Visual workflows
│   ├── RELEASING.md            # Release process
│   ├── TESTING.md              # Testing guide
│   ├── TEST_SUMMARY.md         # Test coverage report
│   ├── PROJECT_SUMMARY.md      # Technical overview
│   └── STATUS.md               # Project status
│
├── tests/
│   └── README.md               # Test-specific documentation
│
└── examples/
    └── (usage examples)
```

## 🔄 Document Relationships

```
User Journey:
../README.md → ../INSTALLATION.md → (start using)

Contributor Journey:
../README.md → CONTRIBUTING.md → QUICK_START.md → COMMIT_CONVENTION.md
                                                   ↓
                                             (make commits)
                                                   ↓
                                             COMMIT_LINT_GUIDE.md (if issues)

Release Journey:
Commit → RELEASING.md → WORKFLOW_DIAGRAM.md → (automated publish)
```

## 📝 Document Purposes

| Document | Location | Purpose | Audience |
|----------|----------|---------|----------|
| README.md | Root | Package overview and usage | Users & Contributors |
| INSTALLATION.md | Root | Setup instructions | Users |
| CHANGELOG.md | Root | Version history | Everyone |
| DOCS.md | .github | Documentation navigation | Everyone |
| CONTRIBUTING.md | .github | How to contribute | Contributors |
| QUICK_START.md | .github | Fast reference | Contributors |
| COMMIT_CONVENTION.md | .github | Commit format rules | Contributors |
| COMMIT_LINT_GUIDE.md | .github | Commit troubleshooting | Contributors |
| RELEASING.md | .github | Release automation | Maintainers |
| WORKFLOW_DIAGRAM.md | .github | Visual workflows | Contributors |
| TESTING.md | .github | Testing guide | Contributors |
| TEST_SUMMARY.md | .github | Test results | Contributors |
| PROJECT_SUMMARY.md | .github | Architecture | Contributors |
| STATUS.md | .github | Implementation status | Everyone |

## 🎯 Common Questions

**Q: How do I install and use this package?**
A: See [README.md](../README.md) and [INSTALLATION.md](../INSTALLATION.md)

**Q: How do I contribute?**
A: Start with [CONTRIBUTING.md](./CONTRIBUTING.md)

**Q: My commit was rejected, what do I do?**
A: Check [COMMIT_LINT_GUIDE.md](./COMMIT_LINT_GUIDE.md)

**Q: How does versioning work?**
A: See [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md)

**Q: How are releases published?**
A: Read [RELEASING.md](./RELEASING.md)

**Q: What's the current project status?**
A: Check [STATUS.md](./STATUS.md)

**Q: What's new in the latest version?**
A: See [CHANGELOG.md](../CHANGELOG.md)

## 🔧 Maintenance

This documentation is maintained by the project maintainers. If you find errors or have suggestions:

1. Open an issue: [GitHub Issues](https://github.com/hv-ojha/ai-integrator/issues)
2. Submit a PR with improvements
3. Follow [CONTRIBUTING.md](./CONTRIBUTING.md) guidelines

---

Last updated: 2025-11-08
