#! /usr/bin/env nix-shell
#! nix-shell -i bash -p node2nix

node2nix -14 --include-peer-dependencies --lock package-lock.json --development
# -i node-packages.json
