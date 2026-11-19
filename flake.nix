{
  description = "Dev shell for effect-t-stack (Scaffold Product + create-effect-t-stack)";

  inputs = {
    # 26.05 still supports Intel Mac (x86_64-darwin); nixpkgs-unstable 26.11 dropped it.
    # Switch back to nixpkgs-unstable when this machine class is gone / support ends (EOL 2026).
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-26.05-darwin";
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
