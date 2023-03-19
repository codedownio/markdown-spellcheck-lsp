{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/release-22.11";

  outputs = { self, nixpkgs }:
    let
      pkgs = import nixpkgs { system = "x86_64-linux"; };
    in
      {
        packages.x86_64-linux.default = with pkgs; callPackage ./build_webpack.nix {};
      };
}
