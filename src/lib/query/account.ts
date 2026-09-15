import { useQuery } from "@tanstack/react-query";
import { getAccountConsultationHistory, getAccountEmergencyHistory, getAccountOverview } from "@/lib/api/account";
import { queryKeys } from "./keys";
import { queryRetryDelay, shouldRetryQuery } from "./retry";

export function useAccountOverviewQuery(enabled = true) {
  return useQuery({ queryKey: queryKeys.account.overview(), queryFn: getAccountOverview, enabled, retry: shouldRetryQuery, retryDelay: queryRetryDelay });
}

export function useAccountConsultationHistoryQuery(page: number, enabled = true) {
  return useQuery({ queryKey: queryKeys.account.consultations(page), queryFn: () => getAccountConsultationHistory(page), enabled, retry: shouldRetryQuery, retryDelay: queryRetryDelay });
}

export function useAccountEmergencyHistoryQuery(page: number, enabled = true) {
  return useQuery({ queryKey: queryKeys.account.emergencyHistory(page), queryFn: () => getAccountEmergencyHistory(page), enabled, retry: shouldRetryQuery, retryDelay: queryRetryDelay });
}
