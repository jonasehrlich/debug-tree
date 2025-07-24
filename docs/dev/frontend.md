# Frontend

## Logging

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
