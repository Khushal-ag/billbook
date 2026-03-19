export class ApiClientError extends Error {
  status: number;
  details?: unknown;
  /** Server/log correlation id from error JSON or `X-Request-Id` response header */
  requestId?: string;

  constructor(message: string, status: number, details?: unknown, requestId?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
    this.requestId = requestId;
  }
}
