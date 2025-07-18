import log from "loglevel";
import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./types/api";

const logger = log.getLogger("api-client");

/**
 * Middleware for the API client to log all requests and their params
 */
const loggerMiddleware: Middleware = {
  async onRequest({ request, params, schemaPath }) {
    if (logger.getLevel() > log.levels.DEBUG) {
      // Exit early if the logger's log level is larger than DEBUG.
      // No need to parse the request if it is anyways not logged
      return;
    }
    const args: unknown[] = [];
    if (Object.hasOwn(params, "query")) {
      args.push("queryParams:", params.query);
    }
    if (Object.hasOwn(params, "path")) {
      args.push("pathParams:", params.path);
    }
    if (
      request.method === "POST" &&
      request.headers.get("content-type")?.includes("application/json") &&
      request.body !== null
    ) {
      const body: unknown = await request.clone().json();
      args.push("body:", body);
    }

    logger.debug(request.method, schemaPath, ...args);
  },
};

export const client = createClient<paths>({ baseUrl: "/" });
client.use(loggerMiddleware);

export interface GitMetadata {
  /** Tag or commit ID */
  rev: string;
  /** Summary of the  */
  summary: string;
  /** Whether {@link rev} refers to a tag */
  isTag: boolean;
}
export async function getCurrentHead(): Promise<GitMetadata> {
  const rev = "HEAD";
  const { data, error } = await client.GET("/api/v1/git/commit/{rev}", {
    params: { path: { rev } },
  });

  if (error) {
    const errorMessage = `Error getting current HEAD revision: ${error.message}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
  return { rev: data.id, summary: data.summary, isTag: false };
}
