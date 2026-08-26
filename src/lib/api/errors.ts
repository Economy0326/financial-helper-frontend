import type { ApiErrorResponse } from "./types";

// Backend가 응답은 했지만 HTTP 상태가 4xx/5xx인 경우
export class ApiResponseError extends Error {
  readonly status: number;
  // Error Contract JSON이 아닌 응답이 있을 수 있으니 response는 nullable
  readonly response: ApiErrorResponse | null;

  // API 오류 객체 초기화
  constructor(
    status: number,
    response: ApiErrorResponse | null,
  ) {
    super(
      response?.error.message ??
        "서버 요청을 처리하지 못했습니다.",
    );

    this.name = "ApiResponseError";
    this.status = status;
    this.response = response;
  }

  get code() {
    return this.response?.error.code ?? null;
  }

  get fieldErrors() {
    return this.response?.error.fieldErrors ?? [];
  }

  get requestId() {
    return this.response?.error.requestId ?? null;
  }
}

// 서버에 정상적으로 도달하지 못한 네트워크 오류
export class ApiNetworkError extends Error {
  constructor(cause?: unknown) {
    super("서버에 연결할 수 없습니다.");

    this.name = "ApiNetworkError";

    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

// Backend 응답이 Frontend가 기대한 API Contract와 다른 경우
export class ApiContractError extends Error {
  constructor(message: string) {
    super(message);

    this.name = "ApiContractError";
  }
}