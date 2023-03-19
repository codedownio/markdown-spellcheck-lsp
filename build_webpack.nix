{ stdenv
, callPackage
, gitignoreSource
, nodejs
}:

let
  nodeDependencies = (callPackage ./. {}).nodeDependencies;

in

stdenv.mkDerivation {
  name = "markdown-spellcheck-lsp-bundle";

  src = gitignoreSource ./.;

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
