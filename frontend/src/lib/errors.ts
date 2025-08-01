import type { components } from "../types/api";

export type ApiStatusDetailResponse =
  components["schemas"]["ApiStatusDetailResponse"];

export class ApiError extends Error {
  public readonly apiResponse: ApiStatusDetailResponse;
  public readonly context: string;

  constructor(response: ApiStatusDetailResponse, context: string) {
    const message = `${context}: ${response.message}`;
    super(message);

    this.name = "APIError";
    this.apiResponse = response;
    this.context = context;
  }
}
