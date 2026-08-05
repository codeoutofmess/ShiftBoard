export interface EmployeeResponse {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface UpdateEmployeeRequest {
  name: string;
  email: string;
  role: string;
}

export interface LocationResponse {
  id: number;
  name: string;
}

export interface LocationRequest {
  name: string;
}

export interface ShiftResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  locationId: number;
  locationName: string;
  startTime: string;
  endTime: string;
}

export interface ShiftRequest {
  employeeId: number;
  locationId: number;
  startTime: string;
  endTime: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  employeeId: number;
  name: string;
  email: string;
  role: string;
}

export interface ApiErrorBody {
  message?: string;
  title?: string;
  errors?: Record<string, string[]>;
}
