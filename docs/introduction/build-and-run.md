# Build and Run

## Production

For the production build, `debug-flow` uses a cargo-based build flow.
To build the backend application which bundles the frontend application, run

```sh
cargo build --release
```

The `build.rs` script will automatically install and build the web-frontend application.

Run the application from _./target/release/debug-flow_.

## Development

For development purposes the frontend is served from a [`vite`](https://vite.dev/) development server to benefit from
features such as hot module reloading.

### Install frontend dependencies

Before starting development, install the frontend dependencies using

```sh
npm clean-install
```

### Run the Development Server

Run the frontend development server by executing

```sh
npm run dev
```

In the development build of the backend application, the requests for the frontend are proxied to the development
server. To run the backend, run

```sh
cargo run -- serve
```

This will serve the application on port 8000. See `cargo run -- serve --help` for more command line flags.

## API

The API is defined in the backend application and documented through [`utoipa`](https://docs.rs/utoipa/latest/utoipa/).
This generates an OpenAPI schema to use with the server.

### Dump the OpenAPI schema

To dump the OpenAPI schema to JSON run

```sh
cargo run --bin dump-openapi-schema
```

For more options for dumping the schema, run `cargo run --bin dump-openapi-schema -- --help`.

### Recreate OpenAPI types for Frontend

To re-generate the API types run

```sh
npm run api:create
```
