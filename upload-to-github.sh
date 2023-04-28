#!/usr/bin/env bash

set -eo pipefail

VERSION=$(cat package.json | jq -r .version)

TAG=v"$VERSION"

bundle=$(nix build .#bundleTarball --no-link --json | jq -r '.[0].outputs.out')/markdown-spellcheck-lsp.tar.gz

echo "Got bundle: $bundle"

echo "Tagging at $TAG"
git tag "$TAG" -f
echo ""

echo "Pushing tags"
git push --tags
echo ""

echo "Creating release"
gh release create "$TAG" "$bundle" --title "$TAG" --notes ""
