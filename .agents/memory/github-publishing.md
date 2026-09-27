---
name: GitHub publishing
description: Connector-specific constraints when exporting this workspace to GitHub and GitHub Pages.
---

When publishing through the connected GitHub API, seed an empty repository with a Contents API commit before using Git Data blobs and trees. The Git Data API rejects workflow paths under `.github/workflows` in this connector context, so do not rely on a Git Data tree to add a Pages workflow.

**Why:** Empty repositories return a conflict for blob creation, and workflow-path uploads were rejected while ordinary dotfiles worked. The connected account also reported that the current plan does not support GitHub Pages for a private repository.

**How to apply:** Upload source with Git Data blobs/trees after seeding the repo. For Pages, use a `docs` static build and legacy branch source only if the repository plan supports Pages; otherwise ask before changing repository visibility.