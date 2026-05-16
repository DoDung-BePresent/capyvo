# Git Workflow & Commit Guidelines

## Branch Strategy

### Main Branches

- **main**: Production-ready code
- **develop**: Integration branch for features

### Feature Branches

- Create from: `develop`
- Merge back to: `develop`
- Naming: `feature/description` or `feature/issue-number-description`

### Hotfix Branches

- Create from: `main`
- Merge back to: `main` and `develop`
- Naming: `hotfix/description`

### Examples

```bash
feature/add-part5-questions
feature/123-payment-integration
hotfix/fix-audio-upload
bugfix/scoring-calculation
```

## Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no logic change)
- **refactor**: Code refactoring (no feature or bug fix)
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process, dependencies, tooling
- **ci**: CI/CD configuration changes

### Scope (Optional)

- **client**: Frontend changes
- **server**: Backend changes
- **api**: API changes
- **db**: Database changes
- **auth**: Authentication/authorization
- **payment**: Payment integration
- **admin**: Admin features
- **exam**: Exam/practice features

### Examples

```bash
feat(client): add Part 5 practice page

Add new page for Part 5 speaking practice with audio recording
and timer functionality.

Closes #123

---

fix(server): correct pronunciation scoring calculation

The scoring algorithm was not properly handling silent audio.
Added validation to check for minimum audio duration.

Fixes #456

---

refactor(api): simplify question service methods

Extracted common query logic into reusable helper functions
to reduce code duplication.

---

chore(deps): update dependencies

Update React to v19 and TanStack Query to v5

---

docs: update API documentation

Add examples for bulk operations endpoints
```

## Commit Best Practices

### Do's

- ✅ Write clear, descriptive commit messages
- ✅ Keep commits atomic (one logical change per commit)
- ✅ Commit often (small, focused commits)
- ✅ Use present tense ("add feature" not "added feature")
- ✅ Reference issue numbers when applicable
- ✅ Explain WHY, not just WHAT
- ✅ Run tests before committing
- ✅ Format code before committing (Prettier)

### Don'ts

- ❌ Don't commit broken code
- ❌ Don't commit commented-out code
- ❌ Don't commit console.log statements
- ❌ Don't commit .env files
- ❌ Don't commit node_modules
- ❌ Don't use vague messages ("fix bug", "update code")
- ❌ Don't commit multiple unrelated changes together
- ❌ Don't commit directly to main

## Pull Request Guidelines

### PR Title

Follow commit message format:

```
feat(client): add Part 5 practice page
```

### PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made

- Added X feature
- Fixed Y bug
- Refactored Z component

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)

[Add screenshots here]

## Related Issues

Closes #123
Related to #456

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Tests pass locally
```

### PR Review Process

1. Create PR from feature branch to develop
2. Request review from team member
3. Address review comments
4. Ensure CI/CD passes
5. Squash and merge when approved

## Git Commands

### Starting New Feature

```bash
# Update develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/my-feature

# Work on feature...
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/my-feature
```

### Keeping Branch Updated

```bash
# Fetch latest changes
git fetch origin

# Rebase on develop
git rebase origin/develop

# Or merge develop into feature
git merge origin/develop
```

### Fixing Mistakes

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Amend last commit
git commit --amend

# Revert a commit
git revert <commit-hash>
```

### Interactive Rebase (Clean History)

```bash
# Rebase last 3 commits
git rebase -i HEAD~3

# Options:
# pick = keep commit
# reword = change commit message
# squash = combine with previous commit
# drop = remove commit
```

## Husky Pre-commit Hooks

### Configured Hooks

- **pre-commit**: Run linter and formatter
- **commit-msg**: Validate commit message format

### Hook Configuration

```bash
# .husky/pre-commit
npm run lint
npm run format
```

### Bypass Hooks (Emergency Only)

```bash
git commit --no-verify -m "emergency fix"
```

## .gitignore

### Essential Ignores

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Environment
.env
.env.local
.env.production

# Build outputs
dist/
build/
*.tsbuildinfo

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Testing
coverage/

# Misc
.cache/
temp/
```

## Release Process

### Version Numbering (Semantic Versioning)

```
MAJOR.MINOR.PATCH

1.0.0 → 1.0.1 (patch - bug fix)
1.0.1 → 1.1.0 (minor - new feature)
1.1.0 → 2.0.0 (major - breaking change)
```

### Creating Release

```bash
# Update version in package.json
npm version patch  # or minor, or major

# Tag release
git tag -a v1.0.1 -m "Release v1.0.1"

# Push tags
git push origin --tags

# Create release notes on GitHub
```

## Merge Strategies

### Squash and Merge (Preferred)

- Combines all commits into one
- Keeps main/develop history clean
- Use for feature branches

### Rebase and Merge

- Maintains individual commits
- Linear history
- Use for small, well-organized branches

### Merge Commit

- Preserves all commits and branch history
- Use for important feature branches

## Conflict Resolution

### Resolving Conflicts

```bash
# Pull latest changes
git pull origin develop

# Conflicts appear in files
# Edit files to resolve conflicts

# Mark as resolved
git add <resolved-files>

# Continue merge/rebase
git merge --continue
# or
git rebase --continue
```

### Avoiding Conflicts

- Pull frequently
- Keep branches short-lived
- Communicate with team about overlapping work
- Use feature flags for large changes

## Best Practices Summary

### Do's

- ✅ Commit early and often
- ✅ Write meaningful commit messages
- ✅ Keep branches up to date
- ✅ Review your own PR before requesting review
- ✅ Delete merged branches
- ✅ Use .gitignore properly
- ✅ Tag releases
- ✅ Document breaking changes

### Don'ts

- ❌ Don't commit to main directly
- ❌ Don't force push to shared branches
- ❌ Don't commit sensitive data
- ❌ Don't leave branches stale
- ❌ Don't merge without review
- ❌ Don't ignore merge conflicts
- ❌ Don't rewrite public history
- ❌ Don't commit generated files
