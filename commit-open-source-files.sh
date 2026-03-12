#!/bin/bash

# Navigate to the root directory
cd /Volumes/RCA/kubernalabs

echo "Creating commits for open-source project files..."

# Commit 1: GitHub issue templates
git add .github/ISSUE_TEMPLATE/
git commit -m "feat(github): add issue templates for bug reports and feature requests"

# Commit 2: GitHub PR template
git add .github/pull_request_template.md
git commit -m "feat(github): add comprehensive pull request template"

# Commit 3: GitHub CI workflow
git add .github/workflows/ci.yml
git commit -m "feat(ci): add CI pipeline for contracts, backend, and SDK"

# Commit 4: GitHub deployment workflow
git add .github/workflows/deploy.yml
git commit -m "feat(ci): add deployment pipeline for multi-environment releases"

# Commit 5: GitHub funding configuration
git add .github/FUNDING.yml
git commit -m "chore(github): add funding and sponsorship configuration"

# Commit 6: Git attributes
git add .gitattributes
git commit -m "chore(git): add gitattributes for proper line endings and file handling"

# Commit 7: Editor configuration
git add .editorconfig
git commit -m "chore(editor): add editorconfig for consistent code style"

# Commit 8: Architecture documentation
git add ARCHITECTURE.md
git commit -m "docs: add comprehensive system architecture documentation"

# Commit 9: API documentation
git add API.md
git commit -m "docs: add complete API documentation with all endpoints"

# Commit 10: Deployment guide
git add DEPLOYMENT.md
git commit -m "docs: add deployment guide for testnet and mainnet"

# Commit 11: Changelog
git add CHANGELOG.md
git commit -m "docs: add changelog following Keep a Changelog format"

# Commit 12: Contributing guidelines
git add CONTRIBUTING.md
git commit -m "docs: enhance contributing guidelines with comprehensive standards"

# Commit 13: Education platform spec
git add .kiro/specs/education-platform/
git commit -m "feat(spec): add education platform specification"

# Commit 14: Commit script
git add make-commits.sh commit-open-source-files.sh
git commit -m "chore: add commit automation scripts"

# Push all commits to GitHub
git push origin main

echo "✅ Successfully created 14 commits and pushed to GitHub!"
