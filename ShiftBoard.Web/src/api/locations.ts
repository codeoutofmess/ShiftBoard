import { apiClient } from "./client";
import type { LocationRequest, LocationResponse } from "./types";

export async function getLocations(): Promise<LocationResponse[]> {
  const { data } = await apiClient.get<LocationResponse[]>("/locations");
  return data;
}

export async function createLocation(request: LocationRequest): Promise<LocationResponse> {
  const { data } = await apiClient.post<LocationResponse>("/locations", request);
  return data;
}
