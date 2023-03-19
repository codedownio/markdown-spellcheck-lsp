#! /usr/bin/env nix-shell
#! nix-shell -i bash -p node2nix

node2nix -14 --include-peer-dependencies -l package-lock.json
# -i node-packages.json
