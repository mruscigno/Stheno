import "server-only";

import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { API_VERSION, type ApiErrorCode, type ApiFailure, type ApiSuccess } from "@/platform/contracts/api";

export function requestId(request: Request) {
  const supplied = request.headers.get("x-request-id")?.trim();
  return supplied && /^[A-Za-z0-9._:-]{8,100}$/.test(supplied) ? supplied : crypto.randomUUID();
}

export function apiSuccess<T>(requestIdValue: string, data: T, init?: ResponseInit, meta?: Record<string, unknown>) {
  const body: ApiSuccess<T> = { apiVersion: API_VERSION, requestId: requestIdValue, data, ...(meta ? { meta } : {}) };
  return NextResponse.json(body, { ...init, headers: { "cache-control": "no-store", ...init?.headers } });
}

export function apiError(requestIdValue: string, status: number, code: ApiErrorCode, message: string, details?: unknown) {
  const body: ApiFailure = { apiVersion: API_VERSION, requestId: requestIdValue, error: { code, message, ...(details === undefined ? {} : { details }) } };
  return NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function parseJson<T>(request: Request, schema: ZodType<T>) {
  try {
    return { data: schema.parse(await request.json()), error: null } as const;
  } catch (error) {
    return { data: null, error: error instanceof ZodError ? error.issues : [{ message: "Invalid JSON body" }] } as const;
  }
}
