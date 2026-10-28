import "server-only";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

export type Logger = Record<LogLevel, (event: string, context?: LogContext) => void>;

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const CONSOLE_METHOD: Record<LogLevel, "debug" | "info" | "warn" | "error"> = {
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error",
};

const REDACTED = "[redacted]";
const SENSITIVE_KEY = /token|password|secret|authorization|cookie|api[-_]?key/i;
const MAX_DEPTH = 4;
const MAX_DETAILS_CHARS = 4000;

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function resolveMinRank(): number {
  const configured = process.env.LOG_LEVEL?.toLowerCase();
  if (configured && configured in LEVEL_RANK) {
    return LEVEL_RANK[configured as LogLevel];
  }
  return isProduction() ? LEVEL_RANK.info : LEVEL_RANK.debug;
}

const MIN_RANK = resolveMinRank();

function sanitize(value: unknown, depth = 0): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }

  if (Array.isArray(value)) {
    return depth >= MAX_DEPTH ? "[array]" : value.map((item) => sanitize(item, depth + 1));
  }

  if (value !== null && typeof value === "object") {
    if (depth >= MAX_DEPTH) {
      return "[object]";
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        SENSITIVE_KEY.test(key) ? REDACTED : sanitize(item, depth + 1),
      ]),
    );
  }

  return value;
}

function emit(scope: string, level: LogLevel, event: string, context?: LogContext): void {
  if (LEVEL_RANK[level] < MIN_RANK) {
    return;
  }

  const details = context ? (sanitize(context) as LogContext) : undefined;
  const write = console[CONSOLE_METHOD[level]];

  if (isProduction()) {
    write(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        scope,
        event,
        ...details,
      }),
    );
    return;
  }

  const label = `${level.toUpperCase()} [${scope}] ${event}`;
  if (details) {
    const text = JSON.stringify(details, null, 2);
    write(label, text.length > MAX_DETAILS_CHARS ? `${text.slice(0, MAX_DETAILS_CHARS)}… [truncado]` : text);
  } else {
    write(label);
  }
}

export function createLogger(scope: string): Logger {
  return {
    debug: (event, context) => emit(scope, "debug", event, context),
    info: (event, context) => emit(scope, "info", event, context),
    warn: (event, context) => emit(scope, "warn", event, context),
    error: (event, context) => emit(scope, "error", event, context),
  };
}
