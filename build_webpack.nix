{ stdenv
, lib
, callPackage
, nodejs
}:

let
  nodeDependencies = (callPackage ./. {}).nodeDependencies.override {
    production = false;
  };

in

stdenv.mkDerivation {
  name = "markdown-spellcheck-lsp-bundle";

  src = lib.cleanSource ./.;

  inherit nodeDependencies;

  buildInputs = [nodejs];

  buildPhase = ''
    cp -r $nodeDependencies/lib/node_modules .
    chmod u+w ./node_modules
    export PATH="node_modules/.bin:$PATH"

    mkdir -p $out
    npm run build
    mv dist $out
  '';

  installPhase = "true";
}
