import createClient from "openapi-fetch";
import type { paths } from "./types/api";

export const client = createClient<paths>();
