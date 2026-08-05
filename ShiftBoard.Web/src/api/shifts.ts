import { apiClient } from "./client";
import type { ShiftRequest, ShiftResponse } from "./types";

export async function getShifts(range: { from: string; to: string }): Promise<ShiftResponse[]> {
  const { data } = await apiClient.get<ShiftResponse[]>("/shifts", { params: range });
  return data;
}

export async function createShift(request: ShiftRequest): Promise<ShiftResponse> {
  const { data } = await apiClient.post<ShiftResponse>("/shifts", request);
  return data;
}

export async function updateShift(id: number, request: ShiftRequest): Promise<ShiftResponse> {
  const { data } = await apiClient.put<ShiftResponse>(`/shifts/${id}`, request);
  return data;
}

export async function deleteShift(id: number): Promise<void> {
  await apiClient.delete(`/shifts/${id}`);
}
