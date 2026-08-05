import axios from "axios";
import type { ApiErrorBody } from "./types";

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
