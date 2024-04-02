{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/release-23.11";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };

        nixFiles = pkgs.runCommand "markdown-spellcheck-lsp-nix-files" { buildInputs = with pkgs; [git node2nix]; } ''
          cp ${./package.json} ./package.json
          cp ${./package-lock.json} ./package-lock.json
          node2nix -- --development --nodejs-18 --lock package-lock.json

          mkdir -p $out
          cp *.nix $out
          cp *.json $out
        '';

        nodejs = pkgs.nodejs-18_x;

        nodeDependencies = (pkgs.callPackage "${nixFiles}" { inherit nodejs; }).nodeDependencies.override {
          production = false;
        };

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
                  node2nix -18 -l package-lock.json
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

            inherit nodeDependencies;

            bundle = with { inherit (pkgs) lib stdenv; };
              stdenv.mkDerivation {
                name = "markdown-spellcheck-lsp-bundle";

                src = pkgs.lib.cleanSourceWith {
                  filter = name: type: let
                    baseName = baseNameOf (toString name);
                    dirName = dirOf (toString name);
                  in
                    lib.hasInfix "/src/" name
                    || baseName == "src"
                    || baseName == "package.json"
                    || baseName == "package-lock.json"
                    || baseName == "tsconfig.json"
                    || baseName == "babel.config.js"
                    || baseName == "webpack.config.js"
                  ;
                  src = ./.;
                };

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

            bundleTarball = with { inherit (pkgs) runCommand; };
              runCommand "markdown-spellcheck-lsp-tarball" {} ''
                mkdir -p "$out"

                mkdir markdown-spellcheck-lsp
                cp -r "${bundle}"/* markdown-spellcheck-lsp

                tar -czvf "$out/markdown-spellcheck-lsp.tar.gz" markdown-spellcheck-lsp
              '';
          };
        }
    );
}
