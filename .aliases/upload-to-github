#!/usr/bin/env bash

set -eo pipefail

for arg do
    shift

    [ "$arg" = "--dry-run" ] && DRY_RUN=t && continue
    [ "$arg" = "--force" ] && FORCE="-f" && continue
done

VERSION=$(cat package.json | jq -r .version)

TAG=v"$VERSION"

bundle=$(nix build .#bundleTarball --no-link --json | jq -r '.[0].outputs.out')/markdown-spellcheck-lsp.tar.gz

echo "Got bundle: $bundle"

if [[ -n "$DRY_RUN" ]]; then
  exit $?
fi

echo "Tagging at $TAG"
git tag "$TAG" -f
echo ""

echo "Pushing tags"
git push --tags $FORCE
echo ""

echo "Creating release"
gh release create "$TAG" "$bundle" --title "$TAG" --notes ""
