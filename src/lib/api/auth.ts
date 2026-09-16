import { apiFetch } from "./client";

export function logout() {
  return apiFetch<void>("/auth/logout", { method: "POST" });
}
