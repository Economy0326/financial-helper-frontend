import { buildApiUrl } from "./config";
import {
  ApiContractError,
  ApiNetworkError,
  ApiResponseError,
} from "./errors";
import type { ApiErrorResponse } from "./types";

// CSRF => 쿠키 기반 요청 위조를 방지하기 위한 검증 토큰
const CSRF_HEADER_NAME = "X-XSRF-TOKEN";

// Local Storage에 저장 x -> 새로고침 시 사라짐
let csrfToken: string | null = null;

type ApiFetchOptions = Omit<
  RequestInit,
  "body" | "credentials"
> & {
  body?: unknown;
  skipCsrfBootstrap?: boolean;
};

// HTTP 요청이 CSRF Token을 붙여야 하는 요청인지 판단
function isUnsafeMethod(method: string) {
  return !["GET", "HEAD", "OPTIONS"].includes(
    method.toUpperCase(),
  );
}

// Local Storage에 안 넣기 때문에 JS 메모리에 따로 기억
function rememberCsrfToken(response: Response) {
  const token = response.headers.get(
    CSRF_HEADER_NAME,
  );

  if (token) {
    csrfToken = token;
  }
}

async function parseApiError(
  response: Response,
): Promise<ApiErrorResponse | null> {
  try {
    const body: unknown = await response.json();

    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body
    ) {
      return body as ApiErrorResponse;
    }

    return null;
  } catch {
    return null;
  }
}

async function ensureCsrfToken() {
  if (csrfToken) {
    return csrfToken;
  }

  await apiFetch("/session", {
    method: "GET",
    // CSRF Token을 얻기 위한 내부 요청 중복 방지
    skipCsrfBootstrap: true,
  });

  if (!csrfToken) {
    throw new ApiContractError(
      "CSRF token was not provided by the server.",
    );
  }

  return csrfToken;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const method = (
    options.method ?? "GET"
  ).toUpperCase();

  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");

  if (options.body !== undefined) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  if (
    isUnsafeMethod(method) &&
    !options.skipCsrfBootstrap
  ) {
    const token = await ensureCsrfToken();

    headers.set(
      CSRF_HEADER_NAME,
      token,
    );
  }

  let response: Response;

  try {
    response = await fetch(buildApiUrl(path), {
      ...options,
      method,
      headers,
      // cookie 요청 가능 (CSRF, GuestSession)
      credentials: "include",
      body:
        options.body === undefined
          ? undefined
          : JSON.stringify(options.body),
    });
  } catch (error) {
    throw new ApiNetworkError(error);
  }

  rememberCsrfToken(response);

  if (!response.ok) {
    throw new ApiResponseError(
      response.status,
      await parseApiError(response),
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiContractError(
      "서버 응답을 읽지 못했습니다.",
    );
  }
}