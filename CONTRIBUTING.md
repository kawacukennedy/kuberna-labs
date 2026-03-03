# Contributing to Kuberna Labs

First off, thank you for considering contributing to Kuberna Labs! It's people like you that make Kuberna a powerful tool for building the Agentic Web3 Enterprise.

### 1. Where do I go from here?

If you've noticed a bug or have a feature request, make sure to check our [Issues](https://github.com/kawacukennedy/kuberna-labs/issues) to see if someone else in the community has already created a ticket. If not, go ahead and make one!

### 2. Fork & create a branch

If this is something you think you can fix, then fork Kuberna Labs and create a branch with a descriptive name.

A good branch name would be (where issue #325 is the ticket you're working on):

```sh
git checkout -b 325-add-solana-adapter
```

### 3. Implement your fix or feature

At this point, you're ready to make your changes. Feel free to ask for help; everyone is a beginner at first :smile_cat:

### 4. Make a Pull Request

At this point, you should switch back to your master branch and make sure it's up to date with Kuberna Labs' main branch:

```sh
git remote add upstream https://github.com/kawacukennedy/kuberna-labs.git
git checkout main
git pull upstream main
```

Then update your feature branch from your local copy of master, and push it!

```sh
git checkout 325-add-solana-adapter
git rebase main
git push --set-upstream origin 325-add-solana-adapter
```

Finally, go to GitHub and [make a Pull Request](https://github.com/kawacukennedy/kuberna-labs/pulls) :D

### 5. Keeping your Pull Request updated

If a maintainer asks you to "rebase" your PR, they're saying that a lot of code has changed, and that you need to update your branch so it's easier to merge.
