# Git Workflow and Branching Strategy

## Overview

This document outlines the Git workflow and branching strategy for the Harry School CRM project. Our workflow is designed to ensure code quality, facilitate collaboration, and maintain a stable main branch.

## Branching Strategy

We use a **Git Flow** inspired branching model with the following branches:

### Main Branches

#### `main`
- **Purpose**: Production-ready code
- **Protection**: Fully protected, requires PR approval
- **Deployment**: Automatically deploys to production
- **Rules**: 
  - No direct commits allowed
  - Requires passing CI/CD pipeline
  - Requires code review approval
  - Requires up-to-date branch

#### `develop`
- **Purpose**: Integration branch for feature development
- **Protection**: Protected, requires PR approval
- **Deployment**: Automatically deploys to staging
- **Rules**:
  - No direct commits allowed
  - Requires passing CI/CD pipeline
  - Base branch for feature branches

### Supporting Branches

#### Feature Branches (`feature/*`)
- **Purpose**: Development of new features
- **Naming**: `feature/HARRY-123-add-student-enrollment`
- **Base**: `develop`
- **Merge Target**: `develop`
- **Lifetime**: Until feature is complete and merged

#### Hotfix Branches (`hotfix/*`)
- **Purpose**: Critical fixes for production
- **Naming**: `hotfix/HARRY-456-fix-login-error`
- **Base**: `main`
- **Merge Target**: Both `main` and `develop`
- **Lifetime**: Until fix is deployed

#### Release Branches (`release/*`)
- **Purpose**: Prepare for a new production release
- **Naming**: `release/v1.2.0`
- **Base**: `develop`
- **Merge Target**: Both `main` and `develop`
- **Lifetime**: Until release is complete

#### Bug Fix Branches (`bugfix/*`)
- **Purpose**: Fix bugs found in develop branch
- **Naming**: `bugfix/HARRY-789-fix-student-search`
- **Base**: `develop`
- **Merge Target**: `develop`
- **Lifetime**: Until bug is fixed and merged

## Branch Naming Conventions

### Format
```
<type>/<ticket-number>-<short-description>
```

### Types
- `feature/` - New features or enhancements
- `bugfix/` - Bug fixes for develop branch
- `hotfix/` - Critical fixes for production
- `release/` - Release preparation
- `chore/` - Maintenance tasks, refactoring
- `docs/` - Documentation updates
- `test/` - Test improvements

### Examples
```bash
feature/HARRY-123-add-student-dashboard
bugfix/HARRY-456-fix-enrollment-validation
hotfix/HARRY-789-fix-critical-auth-bug
release/v1.3.0
chore/HARRY-101-update-dependencies
docs/HARRY-202-api-documentation
test/HARRY-303-add-integration-tests
```

## Commit Message Convention

We follow the **Conventional Commits** specification for consistent commit messages.

### Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks
- `perf` - Performance improvements
- `ci` - CI/CD changes
- `build` - Build system changes

### Examples
```bash
feat(students): add student enrollment functionality

Add comprehensive student enrollment with validation,
email notifications, and audit trail.

Closes HARRY-123

fix(auth): resolve login redirect loop

The authentication middleware was causing infinite
redirects for users with expired sessions.

Fixes HARRY-456

docs(api): update student endpoint documentation

Add examples and error responses for all student
CRUD operations.

test(components): add unit tests for StudentCard

Increase test coverage for student card component
with edge cases and error scenarios.

chore(deps): update React to v18.2.0

Update React and related dependencies to latest
stable versions for security patches.
```

## Workflow Process

### 1. Feature Development

```bash
# Start from latest develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/HARRY-123-add-student-dashboard

# Make changes and commit
git add .
git commit -m "feat(dashboard): add student overview cards"

# Push branch
git push origin feature/HARRY-123-add-student-dashboard

# Create Pull Request via GitHub UI
```

### 2. Code Review Process

#### Before Creating PR
- [ ] Run `npm run quality:fix` to ensure code standards
- [ ] Run `npm run test` to ensure all tests pass
- [ ] Update documentation if needed
- [ ] Add/update tests for new functionality

#### PR Requirements
- [ ] Descriptive title and description
- [ ] Link to related issue/ticket
- [ ] Screenshots for UI changes
- [ ] Test coverage maintained (90%+)
- [ ] All CI checks passing
- [ ] No merge conflicts

#### Review Checklist
- [ ] Code follows established standards
- [ ] Proper error handling implemented
- [ ] Security considerations addressed
- [ ] Performance implications considered
- [ ] Accessibility requirements met
- [ ] TypeScript types are correct
- [ ] Tests are comprehensive
- [ ] Documentation is updated

### 3. Merge Process

#### Merge Types
- **Squash and Merge**: Preferred for feature branches
- **Merge Commit**: For release and hotfix branches
- **Rebase and Merge**: For small, clean commits

#### After Merge
```bash
# Clean up local branches
git checkout develop
git pull origin develop
git branch -d feature/HARRY-123-add-student-dashboard

# Clean up remote branch (optional, GitHub can auto-delete)
git push origin --delete feature/HARRY-123-add-student-dashboard
```

## Release Process

### 1. Prepare Release Branch

```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.3.0

# Update version numbers
npm version minor  # or major/patch

# Commit version bump
git commit -am "chore(release): bump version to v1.3.0"

# Push release branch
git push origin release/v1.3.0
```

### 2. Release Testing

- Deploy to staging environment
- Run full test suite
- Perform manual testing
- Security scan
- Performance testing

### 3. Complete Release

```bash
# Merge to main
git checkout main
git pull origin main
git merge --no-ff release/v1.3.0

# Tag the release
git tag -a v1.3.0 -m "Release version 1.3.0"
git push origin main --tags

# Merge back to develop
git checkout develop
git merge --no-ff release/v1.3.0
git push origin develop

# Delete release branch
git branch -d release/v1.3.0
git push origin --delete release/v1.3.0
```

## Hotfix Process

### 1. Create Hotfix Branch

```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/HARRY-456-fix-critical-auth-bug

# Make the fix
# ... edit files ...

# Commit fix
git commit -am "fix(auth): resolve critical authentication bug

Fixes session validation issue causing user lockouts.

Fixes HARRY-456"
```

### 2. Deploy Hotfix

```bash
# Bump patch version
npm version patch

# Merge to main
git checkout main
git merge --no-ff hotfix/HARRY-456-fix-critical-auth-bug

# Tag and push
git tag -a v1.2.1 -m "Hotfix version 1.2.1"
git push origin main --tags

# Merge back to develop
git checkout develop
git merge --no-ff hotfix/HARRY-456-fix-critical-auth-bug
git push origin develop

# Clean up hotfix branch
git branch -d hotfix/HARRY-456-fix-critical-auth-bug
git push origin --delete hotfix/HARRY-456-fix-critical-auth-bug
```

## Pre-commit Hooks

We use Husky to enforce quality standards before commits:

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run quality checks
npm run quality:fix

# Run tests
npm run test:ci

# Check for large files
git diff --cached --name-only | xargs -I {} sh -c 'if [ $(git cat-file -s "{}") -gt 1048576 ]; then echo "File {} is larger than 1MB"; exit 1; fi'
```

```bash
# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Validate commit message format
npx --no-install commitlint --edit "$1"
```

## Branch Protection Rules

### Main Branch Protection
- Require pull request reviews (2 approvers)
- Dismiss stale reviews when new commits are pushed
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Include administrators in restrictions
- Allow force pushes: **disabled**
- Allow deletions: **disabled**

### Develop Branch Protection
- Require pull request reviews (1 approver)
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Allow force pushes: **disabled**
- Allow deletions: **disabled**

## Automated Workflows

### Pull Request Workflow
1. **Quality Checks**: ESLint, Prettier, TypeScript
2. **Tests**: Unit, integration, and E2E tests
3. **Build**: Verify successful build
4. **Security**: Dependency and code security scans
5. **Performance**: Bundle size and performance checks

### Deployment Workflow
- **Develop → Staging**: Automatic deployment on merge
- **Main → Production**: Automatic deployment with approval gate
- **Rollback**: Automatic rollback on deployment failure

## Git Configuration

### Global Git Configuration
```bash
# Set up user information
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set up default branch
git config --global init.defaultBranch main

# Set up pull strategy
git config --global pull.rebase false

# Set up editor
git config --global core.editor "code --wait"

# Set up diff tool
git config --global diff.tool vscode
git config --global difftool.vscode.cmd 'code --wait --diff $LOCAL $REMOTE'

# Set up merge tool
git config --global merge.tool vscode
git config --global mergetool.vscode.cmd 'code --wait $MERGED'
```

### Project-Specific Configuration
```bash
# Set up hooks path
git config core.hooksPath .husky

# Set up line ending handling
git config core.autocrlf input

# Set up file mode changes
git config core.filemode false
```

## Troubleshooting

### Common Issues and Solutions

#### Merge Conflicts
```bash
# When conflicts occur during merge
git status  # See conflicted files
# Edit files to resolve conflicts
git add .
git commit -m "resolve merge conflicts"
```

#### Accidentally Committed to Wrong Branch
```bash
# Move commits to correct branch
git log --oneline -n 5  # Note commit hashes
git reset --hard HEAD~2  # Remove last 2 commits
git checkout correct-branch
git cherry-pick <commit-hash>
```

#### Revert a Merge Commit
```bash
# Revert a merge commit on main
git revert -m 1 <merge-commit-hash>
```

#### Clean Up Local Branches
```bash
# Delete merged branches
git branch --merged | grep -v "\*\|main\|develop" | xargs -n 1 git branch -d

# Force delete unmerged branches (careful!)
git branch -D feature/old-feature
```

## Best Practices

### Do's
- ✅ Keep commits atomic and focused
- ✅ Write descriptive commit messages
- ✅ Test changes before committing
- ✅ Use meaningful branch names
- ✅ Rebase feature branches before merging
- ✅ Delete branches after merging
- ✅ Tag releases consistently

### Don'ts
- ❌ Commit directly to main or develop
- ❌ Force push to shared branches
- ❌ Commit sensitive information
- ❌ Create overly large pull requests
- ❌ Ignore CI/CD failures
- ❌ Skip code reviews
- ❌ Commit broken code

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Semantic Versioning](https://semver.org/)