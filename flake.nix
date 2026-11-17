{
  description = "Dev shell for effect-t-stack (Scaffold Product + create-effect-t-stack)";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
  };

  outputs = {nixpkgs, ...}: let
    forAllSystems = function:
      nixpkgs.lib.genAttrs nixpkgs.lib.systems.flakeExposed (
        system: function nixpkgs.legacyPackages.${system}
      );
  in {
    formatter = forAllSystems (pkgs: pkgs.alejandra);

    # Scaffold Product: Bun is the primary toolchain.
    # Node: current Active LTS line in nixpkgs (nodejs_24 as of 2026-10; Node 22 LTS ended).
    # pnpm/yarn: optional package managers for generate --package-manager matrix work.
    devShells = forAllSystems (pkgs: {
      default = pkgs.mkShell {
        packages = with pkgs; [
          bun
          nodejs_24
          pnpm
          yarn
          git
        ];

        shellHook = ''
          echo "effect-t-stack flake shell"
          echo "  bun:  $(bun --version 2>/dev/null || echo missing)"
          echo "  node: $(node --version 2>/dev/null || echo missing)"
          echo "  Next: bun install && bun run check"
        '';
      };
    });
  };
}
