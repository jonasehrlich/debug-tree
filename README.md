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

## API

### API documentation

The API documentation is served through the same server using [RapiDoc](https://rapidocweb.com/). It can be accessed on the _/api-docs_ path.

### Dump the OpenAPI schema

To dump the OpenAPI schema to JSON run

```sh
cargo run --bin dump-openapi-schema
```

For more options for dumping the schema, run `cargo run --bin dump-openapi-schema -- --help`.

### Recreate OpenAPI types for Frontend

The API is defined in the backend application and documented through [`utoipa`](https://docs.rs/utoipa/latest/utoipa/).
To re-generate the API types run

```sh
npm run api:create
```

## Frontend

### Logging

For logging the frontend uses [`loglevel`](https://www.npmjs.com/package/loglevel).

By default the loggers are configured to use `INFO` for development builds and `WARNING` for production builds.

To allow modifying the log level of individual loggers temporarily, development builds expose the
`getLogger` function from `loglevel` through the global `window` object.

This allows modifying the log-level on the fly in the browsers debug console:

```typescript
> getLogger("api-client").getLevel()
2
> const logger = getLogger("api-client")
undefined
> logger.getLevel() === logger.levels.INFO
true
> logger.setLevel("debug", false)
undefined
[api-client] GET /api/v1/flows/{id} pathParams:
Object { id: "asdf" }
```
