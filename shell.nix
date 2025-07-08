{ pkgs ? import <nixpkgs> { } }:

pkgs.mkShell {
  buildInputs =
    [ pkgs.nodejs_24 pkgs.rustc pkgs.cargo pkgs.openssl pkgs.pkg-config ];

  shellHook = ''
    export OPENSSL_DIR=${pkgs.openssl.dev}
    export OPENSSL_LIB_DIR=${pkgs.openssl.out}/lib
    export OPENSSL_INCLUDE_DIR=${pkgs.openssl.dev}/include
  '';
}
