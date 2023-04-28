#!/usr/bin/env sh

VERSION=$(cat package.json | jq .version)

TAG=v"$VERSION"

bundle=$(nix build .#bundle --no-link --json | jq -r '.[0].outputs.out')

echo "Got bundle: $bundle"

echo "Tagging at $TAG"
git tag "$TAG" -f
echo ""

echo "Pushing tags"
git push --tags
echo ""

echo "Creating release"
gh release create "$TAG" "$bundle" --title "$TAG" --notes ""
