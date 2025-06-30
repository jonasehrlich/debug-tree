# debug-tree

## Build

To build the backend application which bundles the frontend application, run

```sh
cargo build --release
```

## Development

For development purposes the frontend is served from a [`vite`](https://vite.dev/) development server to benefit from
features such as hot module reloading. Run the development server by executing

```sh
npm run dev
```

In the development build of the backend application, the requests for the frontend are proxied to the development
server. To run the backend, run

```sh
cargo run -- serve
```

This will serve the application on port 8000. See `cargo run -- serve --help` for more command line flags.

## Dump the OpenAPI schema

To dump the OpenAPI schema run

```sh
cargo run --bin dump-openapi-schema
```

For more options for dumping the schema, run `cargo run --bin dump-openapi-schema -- --help`.

## Recreate OpenAPI types for Frontend

The API is defined in the backend application and documented through [`utoipa`](https://docs.rs/utoipa/latest/utoipa/).
To re-generate the API types run

```sh
npm run create-api
```
