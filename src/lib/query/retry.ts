import {
  ApiNetworkError,
  ApiResponseError,
} from "@/lib/api/errors";

export function shouldRetryQuery(
  failureCount: number,
  error: Error,
) {
  if (failureCount >= 2) {
    return false;
  }

  if (error instanceof ApiNetworkError) {
    return true;
  }

  if (error instanceof ApiResponseError) {
    return error.status >= 500;
  }

  return false;
}

export function queryRetryDelay(
  attemptIndex: number,
) {
  return Math.min(
    500 * 2 ** attemptIndex,
    2000,
  );
}