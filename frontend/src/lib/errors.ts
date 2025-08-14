import type { ApiStatusDetailResponse } from "@/types/api-types";

export class ApiError extends Error {
  public readonly apiResponse: ApiStatusDetailResponse;
  public readonly context: string;

  constructor(response: ApiStatusDetailResponse, context: string) {
    const message = `${context}: ${response.message}`;
    super(message);

    this.name = "ApiError";
    this.apiResponse = response;
    this.context = context;
  }
}
