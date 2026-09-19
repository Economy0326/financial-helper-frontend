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

// The response header is the token that the backend paired with the
// Set-Cookie written by that response.  Browsers can expose the previous
// cookie for a short moment while the response is being committed, so keep
// the response value separately until the pair is observable together.
let latestResponseCsrfToken: string | null = null;

// 페이지의 여러 Query가 동시에 Session을 읽어도
// CSRF 쿠키와 응답 헤더가 서로 다른 발급분으로 어긋나지 않게 한다.
let sessionBootstrapPromise: Promise<unknown> | null = null;

// Deduplicate the complete CSRF preparation, not only the GET /session call.
// Several mutations can mount together; resetting the token in each caller
// otherwise lets one request pair a fresh header with another response's
// cookie and makes the first click fail with 403.
let csrfPreparationPromise: Promise<string> | null = null;

// OAuth logout/login changes the account session while this module can stay
// mounted during client-side navigation. Discard all account-bound bootstrap
// state before the next account performs its first unsafe request.
export function resetClientAuthState() {
  csrfToken = null;
  latestResponseCsrfToken = null;
  sessionBootstrapPromise = null;
  csrfPreparationPromise = null;
}

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
  const responseToken = response.headers.get(
    CSRF_HEADER_NAME,
  );
  if (responseToken) {
    latestResponseCsrfToken = responseToken;
  }
  const cookieToken = readCsrfCookie();
  if (cookieToken) {
    csrfToken = cookieToken;
    return;
  }

  if (responseToken) {
    csrfToken = responseToken;
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

async function prepareCsrfToken() {
  // XSRF-TOKEN cookie는 브라우저에서 삭제되거나 OAuth navigation으로
  // 교체될 수 있으므로, 메모리의 이전 값을 쿠키의 존재로 간주하지 않는다.
  // 매 unsafe request 전에 bootstrap을 완료해 cookie/header 쌍을 맞춘다.
  csrfToken = null;
  latestResponseCsrfToken = null;
  await requestSessionBootstrap();

  // CookieCsrfTokenRepository validates the double-submit pair.  After an
  // OAuth account switch the browser may briefly expose the previous cookie
  // while the fresh /session response has already supplied a new header.
  // Wait for that Set-Cookie to commit instead of sending a known mismatched
  // first mutation.  This never retries the unsafe request itself.
  let expectedToken = latestResponseCsrfToken ?? csrfToken;
  const waitForCookieCommit = async () => {
    if (!expectedToken) {
      return false;
    }
    // Do not treat an absent cookie as synchronized. A fetch response can be
    // observable one task before Set-Cookie is committed to document.cookie.
    // Sending the header during that gap produces a first-click CSRF 403.
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const cookieToken = readCsrfCookie();
      if (cookieToken === expectedToken) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    return false;
  };
  let cookieCommitted = await waitForCookieCommit();

  let cookieToken = readCsrfCookie();
  if (expectedToken && cookieToken && cookieToken !== expectedToken) {
    // One more bootstrap is still a safe GET and handles browsers that
    // committed the account-switch cookie after the first response.  The
    // unsafe request is never retried here.
    latestResponseCsrfToken = null;
    await requestSessionBootstrap();
    expectedToken = latestResponseCsrfToken ?? csrfToken;
    cookieCommitted = await waitForCookieCommit();
    cookieToken = readCsrfCookie();
  }

  if (!cookieCommitted || !expectedToken || cookieToken !== expectedToken) {
    throw new ApiContractError(
      "CSRF token cookie and response are not synchronized.",
    );
  }

  csrfToken = cookieToken;
  if (!csrfToken) {
    await requestSessionBootstrap();
    csrfToken = readCsrfCookie() ?? latestResponseCsrfToken;
  }

  if (!csrfToken) {
    throw new ApiContractError(
      "CSRF token was not provided by the server.",
    );
  }

  return csrfToken;
}

async function ensureCsrfToken() {
  if (!csrfPreparationPromise) {
    csrfPreparationPromise = prepareCsrfToken().finally(() => {
      csrfPreparationPromise = null;
    });
  }

  return csrfPreparationPromise;
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
