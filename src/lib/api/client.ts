import "server-only";

import type { z } from "zod";

import { createLogger } from "@/lib/logger";

import {
  type ApiResult,
  err,
  HTTP_INTERNAL_SERVER_ERROR,
  httpError,
  isExpectedStatus,
  MESSAGES,
  networkError,
  ok,
  parseError,
} from "./errors";

const log = createLogger("api");

// Env privada (sem NEXT_PUBLIC_): só o servidor do Next a usa. O browser nunca
// vê a URL do backend — a comunicação passa por Server Actions.
const API_BASE = process.env.API_URL ?? "http://localhost:3333";

const TIMEOUT_MS = 10_000;

// Timeout via AbortController (lição do Saleor/Dify): sem isso, um backend
// pendurado trava a request pra sempre.
async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

// Único ponto que fala com a API. NÃO lança — devolve sempre um ApiResult:
// { ok:true, data } | { ok:false, error }. Valida o sucesso com o `schema`
// (mesma régua do erro).
export async function apiFetch<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<ApiResult<T>> {
  const url = `${API_BASE}${path}`;
  const method = init?.method ?? "GET";
  const startedAt = Date.now();

  let response: Response;

  // Camada 'network': fetch lançar aqui = não alcançou o servidor.
  try {
    response = await fetchWithTimeout(
      url,
      {
        ...init,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...init?.headers,
        },
      },
      TIMEOUT_MS,
    );
  } catch (cause) {
    const isTimeout = cause instanceof Error && cause.name === "AbortError";
    log.error("request_failed", {
      method,
      path,
      durationMs: Date.now() - startedAt,
      reason: isTimeout ? "timeout" : "unreachable",
      error: cause,
    });
    return err(networkError(isTimeout ? MESSAGES.slow : MESSAGES.offline));
  }

  const durationMs = Date.now() - startedAt;
  const status = response.status;

  // Parse defensivo do body (lição comum aos três): pode ser null/HTML.
  const payload: unknown = await response.json().catch(() => null);

  // Camada 'http': servidor respondeu status de erro.
  if (!response.ok) {
    const context = { method, path, status, durationMs, body: payload };
    if (status >= HTTP_INTERNAL_SERVER_ERROR) {
      log.error("upstream_error", context);
    } else if (isExpectedStatus(status)) {
      log.debug("request_rejected", context);
    } else {
      log.warn("request_rejected", context);
    }
    return err(httpError(status));
  }

  // Camada 'parse': resposta ok, mas corpo fora do formato esperado.
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    log.error("response_contract_violation", {
      method,
      path,
      status,
      durationMs,
      body: payload,
      issues: parsed.error.issues,
    });
    return err(parseError());
  }

  log.debug("request_completed", { method, path, status, durationMs });

  return ok(parsed.data);
}
