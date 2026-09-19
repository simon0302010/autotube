import { APIConnectionError, APIError } from "openai";

export function isRetryableError(error: unknown): boolean {
  if (error instanceof APIError) {
    if (error instanceof APIConnectionError) return true;

    if (error.status === 429 || error.status === 408) return true;

    // All server errors
    if (error.status >= 500 && error.status < 600) return true;
  }

  console.warn("Error will not be retried"); // It is safe to assume the error message was already printed

  return false;
}
