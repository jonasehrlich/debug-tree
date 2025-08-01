import { toast } from "sonner";
import { ApiError } from "./errors";

export const notify = {
  success: (message: string) => {
    toast.success(message);
  },
  error: (error: unknown) => {
    let message = "Unknown Error";
    let description: string | undefined;

    if (error instanceof ApiError) {
      message = error.context;
      description = error.apiResponse.message;
      if (error.apiResponse.details) {
        description += `\nDetails: ${error.apiResponse.details.join(", ")}`;
      }
    } else if (typeof error === "string") {
      message = error;
    } else if (
      typeof error === "object" &&
      error !== null &&
      "message" in error
    ) {
      message = String((error as { message?: unknown }).message);
    }

    toast.error(message, {
      description,
    });
  },
};
