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

// 응답 헤더 token은 Backend가 해당 응답의 Set-Cookie와 짝지은 값이다.
// 응답이 반영되는 동안 브라우저가 잠시 이전 cookie를 노출할 수 있으므로
// 두 값을 함께 확인할 수 있을 때까지 응답 값을 별도로 보관한다.
let latestResponseCsrfToken: string | null = null;

// 페이지의 여러 Query가 동시에 Session을 읽어도
// CSRF 쿠키와 응답 헤더가 서로 다른 발급분으로 어긋나지 않게 한다.
let sessionBootstrapPromise: Promise<unknown> | null = null;

// GET /session 호출뿐 아니라 전체 CSRF 준비 과정을 중복 실행하지 않는다.
// 여러 mutation이 함께 마운트될 때 caller마다 token을 초기화하면 한 요청이
// 새 헤더와 다른 응답의 cookie를 짝지어 첫 클릭이 403으로 실패할 수 있다.
let csrfPreparationPromise: Promise<string> | null = null;

// client-side 이동 중 이 모듈이 유지된 상태에서 OAuth logout/login이
// account session을 변경할 수 있다. 다음 account가 첫 unsafe request를
// 보내기 전에 account에 묶인 bootstrap 상태를 모두 폐기한다.
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

  // CookieCsrfTokenRepository가 double-submit 쌍을 검증한다. OAuth account
  // 전환 뒤 새 /session 응답이 새 헤더를 제공했어도 브라우저는 잠시 이전
  // cookie를 노출할 수 있다. 불일치가 확실한 첫 mutation을 보내지 않고
  // Set-Cookie가 반영되기를 기다린다. unsafe request 자체는 재시도하지 않는다.
  let expectedToken = latestResponseCsrfToken ?? csrfToken;
  const waitForCookieCommit = async () => {
    if (!expectedToken) {
      return false;
    }
    // cookie가 없으면 동기화된 것으로 보지 않는다. fetch 응답은 Set-Cookie가
    // document.cookie에 반영되기 한 task 전에 관찰될 수 있다. 그 사이에
    // 헤더를 보내면 첫 클릭에서 CSRF 403이 발생한다.
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
    // bootstrap을 한 번 더 수행해도 안전한 GET이며, 첫 응답 뒤 account 전환
    // cookie를 반영한 브라우저를 처리한다. 여기서 unsafe request는 재시도하지 않는다.
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
