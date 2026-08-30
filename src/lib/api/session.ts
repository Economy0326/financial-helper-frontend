import { apiFetch } from "./client";
import type { SessionResponse } from "./types";

export function getSession() {
  return apiFetch<SessionResponse>(
    "/session",
  );
}