import * as Sentry from "@sentry/nextjs";

type Tags = Record<string, string | number | undefined | null>;

export function captureError(err: unknown, context?: { tags?: Tags; extra?: Record<string, unknown>; message?: string }) {
  if (process.env.NODE_ENV === "development") {
    console.error(context?.message ?? "error", err, context?.extra);
  }
  Sentry.captureException(err, (scope) => {
    if (context?.tags) {
      for (const [k, v] of Object.entries(context.tags)) {
        if (v != null) scope.setTag(k, String(v));
      }
    }
    if (context?.extra) {
      for (const [k, v] of Object.entries(context.extra)) {
        scope.setExtra(k, v);
      }
    }
    if (context?.message) scope.setContext("message", { value: context.message });
    return scope;
  });
}

export function captureMessage(msg: string, level: "info" | "warning" | "error" = "info", tags?: Tags) {
  Sentry.captureMessage(msg, (scope) => {
    scope.setLevel(level);
    if (tags) {
      for (const [k, v] of Object.entries(tags)) {
        if (v != null) scope.setTag(k, String(v));
      }
    }
    return scope;
  });
}
