import axios from "axios";
import { apiClient } from "./client";
import type { ApiErrorBody, AuthResponse, LoginRequest, RegisterRequest } from "./types";

export async function login(request: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", request);
  return data;
}

export async function register(request: RegisterRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", request);
  return data;
}

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const body = error.response?.data;
    if (body?.message) return body.message;
    if (body?.errors) {
      return Object.values(body.errors).flat().join(" ");
    }
    if (body?.title) return body.title;
  }
  return "Something went wrong. Please try again.";
}
