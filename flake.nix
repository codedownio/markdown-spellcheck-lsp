{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/release-22.11";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        default = pkgs.callPackage ./. {};

        nodeDependencies = default.nodeDependencies.override {
          production = false;
        };

        nodejs = pkgs.nodejs-14_x;

      in
        {
          packages = rec {
            nodehunWithNix = with { inherit (pkgs) lib fetchFromGitHub node2nix stdenv; };
              stdenv.mkDerivation {
                name = "nodehun-with-nix";
                src = fetchFromGitHub {
                  owner = "Wulf";
                  repo = "nodehun";
                  rev = "03c9dcf1fcd965031a68553ccaf6487d1fe87f79";
                  sha256 = "13baqdxq8m1rvcqpdx5kwwk32xppwv9k29d2w55ash48akk3v1ij";
                };

                dontConfigure = true;
                dontFixup = true;

                doCheck = false;

                buildInputs = [node2nix];

                buildPhase = ''
                  node2nix -14 -l package-lock.json
                '';

                installPhase = ''
                  cp -r ./. $out
                '';
              };

            nodeHeaders = pkgs.runCommand "node-${nodejs.version}-headers.tar.gz" { buildInputs = [pkgs.gnutar]; } ''
              dir="node-v${nodejs.version}"
              mkdir "$dir"
              cp -r ${nodejs}/include "$dir"
              tar -czvf $out "$dir"
            '';

            nodehun = (pkgs.callPackage nodehunWithNix { inherit nodejs; }).package.override {
              preRebuild = ''
                npm run build -- --tarball ${nodeHeaders}
              '';
              buildInputs = with pkgs; [python3 nodePackages.node-gyp stdenv];
            };

            bundle = with { inherit (pkgs) lib stdenv; };
              stdenv.mkDerivation {
                name = "markdown-spellcheck-lsp-bundle";

                src = lib.cleanSource ./.;

                inherit nodeDependencies;

                buildInputs = [nodejs];

                buildPhase = ''
                  cp -r $nodeDependencies/lib/node_modules .
                  chmod u+w ./node_modules
                  export PATH="node_modules/.bin:$PATH"

                  npm run build
                  mv dist $out
                '';

                installPhase = "true";
              };
          };
        }
    );
}
