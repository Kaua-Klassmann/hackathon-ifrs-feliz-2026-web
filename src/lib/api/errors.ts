export const HTTP_UNAUTHORIZED = 401;
export const HTTP_CONFLICT = 409;
export const HTTP_UNPROCESSABLE_ENTITY = 422;
export const HTTP_INTERNAL_SERVER_ERROR = 500;

export type ApiErrorType = "network" | "http" | "parse";

export type ApiError = {
  type: ApiErrorType;
  message: string;
  status?: number;
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export const ok = <T>(data: T): ApiResult<T> => ({ ok: true, data });
export const err = (error: ApiError): { ok: false; error: ApiError } => ({ ok: false, error });

export const MESSAGES = {
  offline: "Sem conexão. Verifique sua internet e tente novamente.",
  slow: "A conexão demorou mais que o esperado. Tente novamente.",
  ourFault: "Algo deu errado do nosso lado. Tente novamente em alguns instantes.",
  stale: "Não foi possível completar a operação. Atualize a página e tente novamente.",
  invalidData: "Confira os dados informados e tente novamente.",
  invalidCredentials: "E-mail ou senha incorretos.",
  emailTaken: "Já existe uma conta com este e-mail.",
} as const;

export function networkError(message: string): ApiError {
  return { type: "network", message };
}

const STATUS_MESSAGES: Record<number, string> = {
  [HTTP_UNAUTHORIZED]: MESSAGES.invalidCredentials,
  [HTTP_CONFLICT]: MESSAGES.emailTaken,
  [HTTP_UNPROCESSABLE_ENTITY]: MESSAGES.invalidData,
};

const EXPECTED_STATUSES: ReadonlySet<number> = new Set([HTTP_UNAUTHORIZED, HTTP_CONFLICT]);

export function isExpectedStatus(status: number): boolean {
  return EXPECTED_STATUSES.has(status);
}

export function httpError(status: number): ApiError {
  if (status >= HTTP_INTERNAL_SERVER_ERROR) {
    return { type: "http", status, message: MESSAGES.ourFault };
  }

  return { type: "http", status, message: STATUS_MESSAGES[status] ?? MESSAGES.stale };
}

export function parseError(): ApiError {
  return { type: "parse", message: MESSAGES.ourFault };
}
