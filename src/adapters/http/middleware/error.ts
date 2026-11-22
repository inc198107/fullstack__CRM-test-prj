import type { ErrorRequestHandler } from "express";

function validClientStatus(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 400 && value <= 499 ? value : null;
}

function clientStatusFromError(error: unknown): number | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const status = "status" in error ? validClientStatus(error.status) : null;
  return status ?? ("statusCode" in error ? validClientStatus(error.statusCode) : null);
}

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next): void => {
  if (res.headersSent || clientStatusFromError(error) !== null) {
    next(error);
    return;
  }

  console.error("server error: internal");
  res.status(500).json({ error: "Internal server error" });
};
