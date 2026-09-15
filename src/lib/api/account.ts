import { apiFetch } from "./client";
import type {
  AccountConsultationHistoryItem,
  AccountEmergencyHistoryItem,
  AccountOverviewResponse,
  PageResponse,
} from "./types";

export function getAccountOverview() {
  return apiFetch<AccountOverviewResponse>("/account/me");
}

export function getAccountConsultationHistory(page = 0, size = 10) {
  return apiFetch<PageResponse<AccountConsultationHistoryItem>>(
    `/account/consultations?page=${page}&size=${size}`,
  );
}

export function getAccountEmergencyHistory(page = 0, size = 10) {
  return apiFetch<PageResponse<AccountEmergencyHistoryItem>>(
    `/account/emergency-history?page=${page}&size=${size}`,
  );
}
