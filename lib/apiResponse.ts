import { NextResponse } from "next/server";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export function apiSuccess<T>(data: T, message?: string, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      message: message || "Operation completed successfully.",
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

export function apiError(error: string, status: number = 400) {
  return NextResponse.json(
    {
      success: false,
      error,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
