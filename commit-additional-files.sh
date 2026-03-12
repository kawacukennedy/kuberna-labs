#!/bin/bash

# Navigate to the root directory
cd /Volumes/RCA/kubernalabs

echo "Creating commits for additional open-source files..."

# Commit 1: Contributors file
git add CONTRIBUTORS.md
git commit -m "docs: add contributors file with recognition guidelines"

# Commit 2: Roadmap
git add ROADMAP.md
git commit -m "docs: add comprehensive project roadmap through 2027"

# Commit 3: FAQ
git add FAQ.md
git commit -m "docs: add frequently asked questions covering all aspects"

# Commit 4: Code owners
git add .github/CODEOWNERS
git commit -m "chore(github): add code owners for automated PR reviews"

# Commit 5: Docker configuration
git add Dockerfile .dockerignore
git commit -m "feat(docker): add production-ready Dockerfile with multi-stage build"

# Commit 6: Docker Compose
git add docker-compose.yml
git commit -m "feat(docker): add docker-compose with full stack (postgres, redis, nats)"

# Commit 7: Package.json metadata
git add package.json
git commit -m "chore: update package.json with open-source metadata and repository info"

# Commit 8: Examples directory
git add examples/README.md
git commit -m "docs(examples): add examples directory with comprehensive index"

# Commit 9: Basic agent example
git add examples/basic-agent/
git commit -m "feat(examples): add basic agent registration example with full documentation"

# Push all commits to GitHub
git push origin main

echo "✅ Successfully created 9 commits and pushed to GitHub!"
