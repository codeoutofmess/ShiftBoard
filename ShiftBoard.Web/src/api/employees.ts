import { apiClient } from "./client";
import type { EmployeeResponse } from "./types";

export async function getEmployees(): Promise<EmployeeResponse[]> {
  const { data } = await apiClient.get<EmployeeResponse[]>("/employees");
  return data;
}
