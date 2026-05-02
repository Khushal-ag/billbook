"use client";

import type { ReactNode } from "react";
import { toast } from "sonner";
import { ApiClientError } from "@/api/error";
import { REFRESH_PERMISSIONS_EVENT } from "@/constants/access-events";
import { isInactiveRoleGroupAccessMessage } from "@/lib/access/rbac-access";

/** Turn generic HTTP fallbacks into clearer language; keep real API messages as-is. */
function normalizeErrorMessage(message: string, _status?: number): string {
  const m = message.trim();
  if (!m) return "Something went wrong. Please try again.";

  const generic = /^Request failed \((\d+)\)$/i.exec(m);
  if (generic) {
    const code = Number(generic[1]);
    if (code === 404)
      return "We couldn’t find that. It may have been removed or you may not have access.";
    if (code === 403) return "You don’t have permission to do that.";
    if (code === 401) return "Your session has expired. Please sign in again.";
    if (code === 503 || code === 502)
      return "The service is temporarily unavailable. Please try again in a moment.";
    if (code === 429) return "Too many attempts. Please wait a moment and try again.";
    if (code >= 500) return "Something went wrong on our side. Please try again later.";
    return "Something went wrong. Please try again.";
  }

  if (m === "Unexpected API response") {
    return "We couldn’t read the server response. Please try again.";
  }

  return m;
}

function resolveMessage(errorOrMessage: unknown): { text: string; status?: number } {
  if (errorOrMessage === null || errorOrMessage === undefined) {
    return { text: "" };
  }
  if (typeof errorOrMessage === "string") {
    return { text: errorOrMessage };
  }
  if (errorOrMessage instanceof ApiClientError) {
    return {
      text: normalizeErrorMessage(errorOrMessage.message, errorOrMessage.status),
      status: errorOrMessage.status,
    };
  }
  if (errorOrMessage instanceof Error) {
    return { text: normalizeErrorMessage(errorOrMessage.message) };
  }
  return { text: "Something went wrong. Please try again." };
}

function copyReferenceAction(requestId: string) {
  return {
    label: "Copy reference",
    onClick: () => {
      void navigator.clipboard?.writeText(requestId).catch(() => {});
    },
  };
}

function ErrorToastBody({
  message,
  requestId,
}: {
  message: string;
  requestId?: string;
}): ReactNode {
  return (
    <div className="space-y-2 text-left">
      <p className="whitespace-pre-line text-sm leading-snug text-foreground">{message}</p>
      {requestId ? (
        <div className="border-t border-border/50 pt-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Support reference
          </p>
          <p className="mt-1 break-all font-mono text-[11px] leading-relaxed text-muted-foreground">
            {requestId}
          </p>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Share this if you contact support so we can find what happened.
          </p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Show a standardized error toast.
 * - showErrorToast(error, title): short title + message body (and support reference on its own, not mixed into the sentence)
 * - showErrorToast(message): message as the main toast body
 */
export function showErrorToast(errorOrMessage: unknown, title?: string) {
  const requestId = errorOrMessage instanceof ApiClientError ? errorOrMessage.requestId : undefined;

  if (
    errorOrMessage instanceof ApiClientError &&
    errorOrMessage.status === 403 &&
    typeof window !== "undefined" &&
    !isInactiveRoleGroupAccessMessage(errorOrMessage.message)
  ) {
    window.dispatchEvent(new Event(REFRESH_PERMISSIONS_EVENT));
  }

  /** `showErrorToast(null, "…")` — only the second string is shown (validation-style messages). */
  if ((errorOrMessage === null || errorOrMessage === undefined) && title !== undefined) {
    toast.error(title);
    return;
  }

  const { text } = resolveMessage(errorOrMessage);

  if (title !== undefined) {
    toast.error(title, {
      description: <ErrorToastBody message={text} requestId={requestId} />,
      classNames: {
        description: "!items-start !text-left !text-foreground",
      },
      ...(requestId ? { action: copyReferenceAction(requestId) } : {}),
    });
    return;
  }

  if (requestId) {
    toast.error("Something went wrong", {
      description: <ErrorToastBody message={text} requestId={requestId} />,
      classNames: {
        description: "!items-start !text-left !text-foreground",
      },
      action: copyReferenceAction(requestId),
    });
    return;
  }

  toast.error(text);
}

/**
 * Show a success toast. Optional `description` appears as secondary line (keep both short).
 */
export function showSuccessToast(message: string, description?: string) {
  if (description) {
    toast.success(message, { description });
    return;
  }
  toast.success(message);
}
