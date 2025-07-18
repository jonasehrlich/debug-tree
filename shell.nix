{ pkgs ? import <nixpkgs> { } }:

pkgs.mkShell {
  buildInputs =
    # TODO use rust overay to install rust toolchain
    [ pkgs.nodejs_24 pkgs.openssl pkgs.pkg-config pkgs.pre-commit ];

  shellHook = ''
    export OPENSSL_DIR=${pkgs.openssl.dev}
    export OPENSSL_LIB_DIR=${pkgs.openssl.out}/lib
    export OPENSSL_INCLUDE_DIR=${pkgs.openssl.dev}/include
  '';
}
