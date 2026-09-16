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

// 페이지의 여러 Query가 동시에 Session을 읽어도
// CSRF 쿠키와 응답 헤더가 서로 다른 발급분으로 어긋나지 않게 한다.
let sessionBootstrapPromise: Promise<unknown> | null = null;

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

function readCsrfCookie() {
  if (typeof document === "undefined") {
    return null;
  }

  const entry = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith("XSRF-TOKEN="));

  return entry
    ? decodeURIComponent(entry.slice("XSRF-TOKEN=".length))
    : null;
}

// Local Storage에 안 넣기 때문에 JS 메모리에 따로 기억
function rememberCsrfToken(response: Response) {
  const cookieToken = readCsrfCookie();
  if (cookieToken) {
    csrfToken = cookieToken;
    return;
  }

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
  // XSRF-TOKEN cookie는 브라우저에서 삭제되거나 OAuth navigation으로
  // 교체될 수 있으므로, 메모리의 이전 값을 쿠키의 존재로 간주하지 않는다.
  // 매 unsafe request 전에 bootstrap을 완료해 cookie/header 쌍을 맞춘다.
  csrfToken = null;
  await requestSessionBootstrap();

  // CookieCsrfTokenRepository validates the double-submit pair. Prefer the
  // browser cookie after bootstrap so a stale in-memory response header is
  // never sent with a different cookie. A second bootstrap is only a
  // preflight for browsers that have not committed Set-Cookie yet; no failed
  // mutation is retried.
  csrfToken = readCsrfCookie() ?? csrfToken;
  if (!readCsrfCookie()) {
    await requestSessionBootstrap();
    csrfToken = readCsrfCookie() ?? csrfToken;
  }

  if (!csrfToken) {
    throw new ApiContractError(
      "CSRF token was not provided by the server.",
    );
  }

  return csrfToken;
}

async function requestSessionBootstrap<T = unknown>() {
  if (!sessionBootstrapPromise) {
    sessionBootstrapPromise = apiFetch<T>("/session", {
      method: "GET",
      // CSRF Token을 얻기 위한 내부 요청 중복 방지
      skipCsrfBootstrap: true,
    }).finally(() => {
      sessionBootstrapPromise = null;
    });
  }

  return (await sessionBootstrapPromise) as T;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const method = (
    options.method ?? "GET"
  ).toUpperCase();

  const headers = new Headers(options.headers);

  if (
    path === "/session" &&
    method === "GET" &&
    !options.skipCsrfBootstrap
  ) {
    return requestSessionBootstrap<T>();
  }

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
