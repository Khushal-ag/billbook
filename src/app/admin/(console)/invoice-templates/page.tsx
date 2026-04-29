"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  FileUp,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
  Unlink,
  Upload,
  XCircle,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/core/utils";
import { showErrorToast, showSuccessToast } from "@/lib/ui/toast-helpers";
import { useAdminBusinesses } from "@/hooks/use-admin-businesses";
import {
  useAdminInvoiceTemplates,
  useAssignInvoiceTemplate,
  useDeleteInvoiceTemplate,
  useInvoiceTemplateCompare,
  usePublishInvoiceTemplateVersion,
  useReoptimizeInvoiceTemplate,
  useUnassignInvoiceTemplate,
  useUploadInvoiceTemplate,
} from "@/hooks/use-admin-invoice-templates";
import type {
  InvoiceTemplate,
  TemplateScope,
  TemplateVersion,
  UploadTemplateData,
} from "@/types/admin-invoice-template";

const MAX_TEMPLATE_SIZE_BYTES = 2 * 1024 * 1024;
const UI_PUBLISH_QUALITY_THRESHOLD = 80;

const AI_PROCESS_STEPS = [
  "Parsing uploaded HTML structure",
  "Converting layout to safe template blocks",
  "Mapping invoice data placeholders",
  "Validating Handlebars tokens & expressions",
  "Scoring template quality with AI checks",
  "Rendering visual preview from sample data",
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function QualityBadge({ score }: { score: number | undefined | null }) {
  if (score === undefined || score === null) return null;
  const isGreen = score >= 80;
  const isYellow = score >= 60 && score < 80;
  const tooltip = isGreen
    ? `Score ${score}/100 — meets the publish threshold (≥ 80).`
    : isYellow
      ? `Score ${score}/100 — below publish threshold of 80. Re-optimize to improve.`
      : `Score ${score}/100 — significant quality issues. Re-optimize before publishing.`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex cursor-default items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold",
            isGreen &&
              "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400",
            isYellow &&
              "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
            !isGreen &&
              !isYellow &&
              "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400",
          )}
        >
          {isGreen ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : isYellow ? (
            <AlertTriangle className="h-3 w-3" />
          ) : (
            <XCircle className="h-3 w-3" />
          )}
          {score}/100
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[200px] text-center text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

function formatModelLabel(selectedModel: string | null | undefined): string | null {
  if (!selectedModel) return null;
  if (selectedModel === "default-fallback") return "Default template (AI unavailable)";
  if (selectedModel.includes(" -> ")) {
    const [primary, repair] = selectedModel.split(" -> ");
    return `${primary?.trim()} → repaired by ${repair?.trim()}`;
  }
  return selectedModel;
}

function AiProcessingPanel({ stepIndex }: { stepIndex: number }) {
  return (
    <div className="mt-3 rounded-lg border border-sky-200/70 bg-gradient-to-br from-sky-50 to-violet-50 p-4 dark:border-sky-800/40 dark:from-sky-950/30 dark:to-violet-950/30">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 animate-pulse text-sky-600 dark:text-sky-400" />
        <p className="text-sm font-semibold text-sky-900 dark:text-sky-100">
          AI is transforming your template…
        </p>
      </div>
      <div className="space-y-2">
        {AI_PROCESS_STEPS.map((step, i) => {
          const isDone = i < stepIndex;
          const isCurrent = i === stepIndex;
          return (
            <div
              key={step}
              className={cn(
                "flex items-center gap-2 text-xs transition-all duration-300",
                isDone && "text-emerald-700 dark:text-emerald-400",
                isCurrent && "font-medium text-sky-700 dark:text-sky-300",
                i > stepIndex && "text-muted-foreground/40",
              )}
            >
              {isDone ? (
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin" />
              ) : (
                <div className="border-current/20 h-3.5 w-3.5 flex-shrink-0 rounded-full border" />
              )}
              {step}
            </div>
          );
        })}
      </div>
      <div className="mt-3">
        <Progress
          value={Math.round(((stepIndex + 1) / AI_PROCESS_STEPS.length) * 100)}
          className="h-1 bg-sky-100 dark:bg-sky-900/40"
        />
      </div>
    </div>
  );
}

function AiResultPanel({
  result,
  onDismiss,
}: {
  result: UploadTemplateData;
  onDismiss: () => void;
}) {
  const warnings = result.validationWarnings ?? [];
  const errors = result.validationErrors ?? [];
  const hasFallback = result.selectedModel === "default-fallback";

  return (
    <div className="rounded-lg border border-violet-200/70 bg-gradient-to-br from-violet-50 to-sky-50 p-4 dark:border-violet-800/40 dark:from-violet-950/30 dark:to-sky-950/30">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">
            AI Analysis Complete — v{result.version} created
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-lg leading-none text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <QualityBadge score={result.qualityScore} />
        {result.selectedModel && !hasFallback && (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
            <BrainCircuit className="h-3 w-3" />
            {formatModelLabel(result.selectedModel)}
          </span>
        )}
        {hasFallback && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            Default template applied
          </span>
        )}
      </div>

      {errors.length > 0 && (
        <div className="mt-3 space-y-1">
          <p className="text-xs font-medium text-destructive">
            Validation errors ({errors.length})
          </p>
          {errors.map((e, i) => (
            <p key={i} className="flex items-start gap-1.5 text-xs text-destructive">
              <XCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
              {e}
            </p>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer select-none text-amber-700 dark:text-amber-400">
            {warnings.length} warning{warnings.length > 1 ? "s" : ""} — click to review
          </summary>
          <ul className="mt-1.5 space-y-1 pl-1">
            {warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </details>
      )}

      {result.aiNotes && (
        <div className="mt-2.5 border-t border-violet-100/60 pt-2.5 dark:border-violet-900/30">
          {result.aiNotes.length <= 120 ? (
            <p className="text-xs italic leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
              {result.aiNotes}
            </p>
          ) : (
            <details className="text-xs">
              <summary className="cursor-pointer select-none italic text-muted-foreground [overflow-wrap:anywhere]">
                {result.aiNotes.slice(0, 90).trimEnd()}…
              </summary>
              <p className="mt-1 leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                {result.aiNotes}
              </p>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function VersionDiagnostics({ version }: { version: TemplateVersion }) {
  const warnings = version.validationWarnings ?? [];
  const errors = version.validationErrors ?? [];
  const isDefaultFallback = version.selectedModel === "default-fallback";
  const hasContent =
    warnings.length > 0 || errors.length > 0 || version.aiNotes || isDefaultFallback;
  if (!hasContent) return null;

  return (
    <details className="mt-2 rounded-md border border-border/50 bg-muted/20 text-xs">
      <summary className="flex cursor-pointer select-none items-center gap-1.5 px-2.5 py-2 text-muted-foreground hover:text-foreground">
        <BrainCircuit className="h-3 w-3 flex-shrink-0" />
        <span>AI Diagnostics</span>
        {errors.length > 0 && (
          <span className="ml-1 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] text-destructive">
            {errors.length} error{errors.length > 1 ? "s" : ""}
          </span>
        )}
        {warnings.length > 0 && (
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            {warnings.length} warning{warnings.length > 1 ? "s" : ""}
          </span>
        )}
        {isDefaultFallback && (
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
            default template
          </span>
        )}
        <ChevronDown className="ml-auto h-3 w-3" />
      </summary>

      <div className="space-y-1.5 border-t border-border/50 px-2.5 py-2">
        {isDefaultFallback && (
          <p className="flex items-start gap-1.5 text-amber-700 [overflow-wrap:anywhere] dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
            Platform default template was applied — the uploaded HTML did not contain a recognizable
            invoice structure.
          </p>
        )}

        {errors.map((e, i) => (
          <p key={i} className="flex items-start gap-1.5 text-destructive [overflow-wrap:anywhere]">
            <XCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
            {e}
          </p>
        ))}

        {warnings.map((w, i) => (
          <p
            key={i}
            className="flex items-start gap-1.5 text-amber-700 [overflow-wrap:anywhere] dark:text-amber-400"
          >
            <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
            {w}
          </p>
        ))}

        {version.aiNotes && !isDefaultFallback && (
          <>
            {(errors.length > 0 || warnings.length > 0) && <Separator className="my-1" />}
            {version.aiNotes.length <= 120 ? (
              <p className="italic leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                {version.aiNotes}
              </p>
            ) : (
              <details>
                <summary className="cursor-pointer select-none italic text-muted-foreground [overflow-wrap:anywhere]">
                  {version.aiNotes.slice(0, 80).trimEnd()}…
                </summary>
                <p className="mt-1 leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                  {version.aiNotes}
                </p>
              </details>
            )}
          </>
        )}
      </div>
    </details>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

function templateVersionsSorted(template: InvoiceTemplate): TemplateVersion[] {
  return [...template.versions].sort((a, b) => b.version - a.version);
}

function publishBlockReason(version: TemplateVersion): string | null {
  if (version.status === "PUBLISHED") return "Already published";
  const errors = version.validationErrors ?? [];
  if (errors.length > 0)
    return `Fix ${errors.length} validation error${errors.length > 1 ? "s" : ""} before publishing`;
  const score = version.qualityScore ?? 0;
  if (score < UI_PUBLISH_QUALITY_THRESHOLD)
    return `Quality score ${score}/100 — minimum ${UI_PUBLISH_QUALITY_THRESHOLD} required`;
  return null;
}

export default function AdminInvoiceTemplatesPage() {
  const templatesQuery = useAdminInvoiceTemplates();
  const businessesQuery = useAdminBusinesses(200, 0);
  const uploadMutation = useUploadInvoiceTemplate();
  const reoptimizeMutation = useReoptimizeInvoiceTemplate();
  const publishMutation = usePublishInvoiceTemplateVersion();
  const deleteTemplateMutation = useDeleteInvoiceTemplate();
  const unassignMutation = useUnassignInvoiceTemplate();
  const assignMutation = useAssignInvoiceTemplate();
  const compareMutation = useInvoiceTemplateCompare();

  // Upload form
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [scope, setScope] = useState<TemplateScope>("PLATFORM");
  const [ownerBusinessId, setOwnerBusinessId] = useState<string>("");
  const [appendToTemplateId, setAppendToTemplateId] = useState<string>("new");
  const [formError, setFormError] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [aiStepIndex, setAiStepIndex] = useState(0);
  const [lastUploadResult, setLastUploadResult] = useState<UploadTemplateData | null>(null);
  const [uploadedFileHtml, setUploadedFileHtml] = useState<string | null>(null);
  const [selectedFilePreviewOpen, setSelectedFilePreviewOpen] = useState(false);

  // Preview / library
  const [activeVersionId, setActiveVersionId] = useState<number | null>(null);
  const [renderedPreviewHtml, setRenderedPreviewHtml] = useState<string | null>(null);
  const [originalPreviewHtml, setOriginalPreviewHtml] = useState<string | null>(null);
  const [previewView, setPreviewView] = useState<"converted" | "original" | "compare">("converted");
  const [loadingPreviewVersionId, setLoadingPreviewVersionId] = useState<number | null>(null);
  const [loadingOriginalVersionId, setLoadingOriginalVersionId] = useState<number | null>(null);

  // Assign
  const [setAsPlatformDefault, setSetAsPlatformDefault] = useState(true);
  const [assignBusinessId, setAssignBusinessId] = useState<string>("");

  // Delete dialog
  const [templateToDelete, setTemplateToDelete] = useState<InvoiceTemplate | null>(null);

  const templates = useMemo(() => templatesQuery.data ?? [], [templatesQuery.data]);
  const businesses = businessesQuery.data?.items ?? [];

  const templateVersionMap = useMemo(() => {
    const map = new Map<
      number,
      { templateId: number; version: TemplateVersion; template: InvoiceTemplate }
    >();
    for (const template of templates) {
      for (const version of template.versions) {
        map.set(version.id, { templateId: template.id, version, template });
      }
    }
    return map;
  }, [templates]);

  // Animate AI steps while optimizing
  useEffect(() => {
    if (!isOptimizing) {
      setAiStepIndex(0);
      return;
    }
    const timer = window.setInterval(
      () => setAiStepIndex((prev) => Math.min(prev + 1, AI_PROCESS_STEPS.length - 1)),
      1500,
    );
    return () => window.clearInterval(timer);
  }, [isOptimizing]);

  // Read uploaded file for "Original" preview
  useEffect(() => {
    if (!file) {
      setUploadedFileHtml(null);
      return;
    }
    let cancelled = false;
    const reader = new FileReader();
    reader.onload = () => {
      if (!cancelled && typeof reader.result === "string") {
        setUploadedFileHtml(reader.result);
      }
    };
    reader.onerror = () => {
      if (!cancelled) setUploadedFileHtml(null);
    };
    reader.readAsText(file);
    return () => {
      cancelled = true;
    };
  }, [file]);

  const validateUpload = () => {
    if (!file) return "Template HTML file is required.";
    if (file.size > MAX_TEMPLATE_SIZE_BYTES) return "Template file size must be 2 MB or less.";
    if (!name.trim()) return "Template name is required.";
    if (scope === "ORG" && !ownerBusinessId) return "Owner business is required for ORG scope.";
    return null;
  };

  const resetPreviewState = () => {
    setRenderedPreviewHtml(null);
    setOriginalPreviewHtml(null);
    setPreviewView("converted");
  };

  const fetchRenderedPreview = async (url: string) => {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.text();
    } catch {
      /* use URL fallback */
    }
    return null;
  };

  const onLoadPreview = async (templateId: number, versionId: number) => {
    setActiveVersionId(versionId);
    resetPreviewState();
    setLoadingPreviewVersionId(versionId);
    try {
      const entry = templateVersionMap.get(versionId);
      let previewUrl = entry?.version.previewUrl ?? null;
      if (!previewUrl) {
        // Fall back to preview endpoint for fresh signed URL
        const res = await compareMutation.mutateAsync({ templateId, versionId });
        previewUrl = res.renderedPreviewUrl;
      }
      if (previewUrl) {
        const html = await fetchRenderedPreview(previewUrl);
        setRenderedPreviewHtml(html);
      }
      // Pre-fill original if this was the just-uploaded version
      if (lastUploadResult?.versionId === versionId && uploadedFileHtml) {
        setOriginalPreviewHtml(uploadedFileHtml);
      }
    } catch (e) {
      showErrorToast(e, "Unable to load preview");
    } finally {
      setLoadingPreviewVersionId(null);
    }
  };

  const onLoadOriginal = async (templateId: number, versionId: number) => {
    if (originalPreviewHtml !== null) return;
    // Use already-available file HTML if this was just uploaded
    if (lastUploadResult?.versionId === versionId && uploadedFileHtml) {
      setOriginalPreviewHtml(uploadedFileHtml);
      return;
    }
    setLoadingOriginalVersionId(versionId);
    try {
      const res = await compareMutation.mutateAsync({ templateId, versionId });
      if (res.originalTemplateUrl) {
        const html = await fetchRenderedPreview(res.originalTemplateUrl);
        setOriginalPreviewHtml(html);
      }
    } catch {
      showErrorToast(null, "Could not load original template");
    } finally {
      setLoadingOriginalVersionId(null);
    }
  };

  const resetUploadForm = () => {
    setFile(null);
    setName("");
    setScope("PLATFORM");
    setOwnerBusinessId("");
    setAppendToTemplateId("new");
    setFormError(null);
    setUploadedFileHtml(null);
  };

  const onFileSelected = (nextFile: File | null) => {
    setFile(nextFile);
    if (nextFile) setFormError(null);
  };

  const onUpload = async () => {
    const err = validateUpload();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(null);
    setIsOptimizing(true);
    try {
      const created = await uploadMutation.mutateAsync({
        templateFile: file!,
        name: name.trim(),
        scope,
        ownerBusinessId: scope === "ORG" ? Number(ownerBusinessId) : undefined,
        templateId: appendToTemplateId !== "new" ? Number(appendToTemplateId) : undefined,
      });
      setLastUploadResult(created);
      setActiveVersionId(created.versionId);
      resetPreviewState();
      if (created.previewUrl) {
        const html = await fetchRenderedPreview(created.previewUrl);
        setRenderedPreviewHtml(html);
      }
      if (uploadedFileHtml) setOriginalPreviewHtml(uploadedFileHtml);
      resetUploadForm();
    } catch (e) {
      showErrorToast(e, "Template upload failed");
    } finally {
      setIsOptimizing(false);
    }
  };

  const onReoptimize = async (templateId: number, versionId?: number) => {
    try {
      const next = await reoptimizeMutation.mutateAsync({ templateId, versionId });
      showSuccessToast(
        next.reoptimizedFromVersionId
          ? `Re-optimized from v${next.reoptimizedFromVersionId} → v${next.version}.`
          : `Re-optimized to v${next.version}.`,
      );
      setLastUploadResult(next);
      setActiveVersionId(next.versionId);
      resetPreviewState();
      if (next.previewUrl) {
        const html = await fetchRenderedPreview(next.previewUrl);
        setRenderedPreviewHtml(html);
      }
    } catch (e) {
      showErrorToast(e, "Re-optimization failed");
    }
  };

  const onPublish = async (templateId: number, versionId: number) => {
    try {
      const published = await publishMutation.mutateAsync({ templateId, versionId });
      showSuccessToast(`v${published.version} published successfully.`);
    } catch (e) {
      showErrorToast(e, "Publish failed");
    }
  };

  const onAssign = async (templateVersionId: number) => {
    if (!setAsPlatformDefault && !assignBusinessId) {
      showErrorToast(null, "Choose an organization before assigning.");
      return;
    }
    try {
      const result = await assignMutation.mutateAsync(
        setAsPlatformDefault
          ? { templateVersionId, setAsPlatformDefault: true }
          : {
              templateVersionId,
              businessId: Number(assignBusinessId),
              setAsPlatformDefault: false,
            },
      );
      showSuccessToast(
        result.scope === "PLATFORM" ? "Assigned as platform default." : "Assigned to organization.",
      );
    } catch (e) {
      showErrorToast(e, "Assignment failed");
    }
  };

  const onUnassign = async (template: InvoiceTemplate) => {
    try {
      const result = await unassignMutation.mutateAsync({ templateId: template.id });
      showSuccessToast(
        result.unassignedCount > 0
          ? `Removed ${result.unassignedCount} assignment${result.unassignedCount > 1 ? "s" : ""} from "${template.name}".`
          : `"${template.name}" had no active assignments.`,
      );
    } catch (e) {
      showErrorToast(e, "Unassign failed");
    }
  };

  const onDeleteConfirmed = async () => {
    if (!templateToDelete) return;
    const target = templateToDelete;
    setTemplateToDelete(null);
    try {
      await deleteTemplateMutation.mutateAsync({ templateId: target.id });
      if (
        activeVersionId !== null &&
        templateVersionMap.get(activeVersionId)?.template.id === target.id
      ) {
        setActiveVersionId(null);
        resetPreviewState();
      }
      if (lastUploadResult) {
        const entry = templateVersionMap.get(lastUploadResult.versionId);
        if (entry?.template.id === target.id) setLastUploadResult(null);
      }
      showSuccessToast(`"${target.name}" archived.`);
    } catch (e) {
      showErrorToast(e, "Cannot archive — template is still assigned. Use Unlink first.");
    }
  };

  return (
    <TooltipProvider>
      <div className="relative animate-fade-in space-y-6">
        <PageHeader
          title="Invoice template library"
          description="Upload custom invoice designs — AI converts, validates, and previews them instantly."
        />

        {/* ── Upload card ─────────────────────────────────────────── */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-muted/20">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-4 w-4" />
              Upload or add new version
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-400">
                <Sparkles className="h-3 w-3" />
                AI-powered
              </span>
            </CardTitle>
            <CardDescription>
              Upload any HTML invoice design. AI transforms it into a safe, reusable Handlebars
              template and renders a live preview.
            </CardDescription>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border/70 bg-background px-2 py-0.5">
                1. Upload HTML
              </span>
              <span className="rounded-full border border-border/70 bg-background px-2 py-0.5">
                2. AI optimize
              </span>
              <span className="rounded-full border border-border/70 bg-background px-2 py-0.5">
                3. Preview and publish
              </span>
            </div>
            {isOptimizing && <AiProcessingPanel stepIndex={aiStepIndex} />}
          </CardHeader>

          <CardContent className="space-y-4 p-4 sm:p-6">
            <fieldset disabled={isOptimizing} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="template-file" required>
                  HTML template file
                </Label>
                <div className="min-h-[22rem]">
                  {!file ? (
                    <>
                      <div
                        className={cn(
                          "relative flex min-h-[18.5rem] items-center justify-center rounded-xl border border-dashed border-border/80 bg-gradient-to-br from-muted/30 via-background to-muted/20 p-6 transition-colors",
                          "cursor-pointer hover:border-primary/50 hover:from-primary/5 hover:to-muted/30",
                          isDraggingFile && "border-primary bg-primary/10",
                        )}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingFile(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          setIsDraggingFile(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingFile(false);
                          const dropped = e.dataTransfer.files?.[0] ?? null;
                          onFileSelected(dropped);
                        }}
                      >
                        <Input
                          id="template-file"
                          type="file"
                          accept=".html,text/html"
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
                        />
                        <div className="pointer-events-none mx-auto flex w-full max-w-md flex-col items-center justify-center text-center">
                          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/70 bg-background shadow-sm">
                            <FileUp className="h-7 w-7 text-primary" />
                          </div>
                          <p className="text-base font-semibold tracking-tight">
                            Drag & drop HTML file here, or click to browse
                          </p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Supports .html files up to 2 MB
                          </p>
                          <p className="mt-4 text-xs text-muted-foreground">
                            AI will optimize and generate preview after upload.
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">No file selected · max 2 MB</p>
                    </>
                  ) : (
                    <div className="min-h-[18.5rem] rounded-xl border border-border/70 bg-muted/20 p-4">
                      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_250px] md:items-stretch">
                        <div className="min-w-0 space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="space-y-1">
                              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                File ready
                              </p>
                              <p className="text-sm font-medium text-foreground">
                                Template selected successfully
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                id="template-file-replace"
                                type="file"
                                accept=".html,text/html"
                                className="hidden"
                                onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-7"
                              >
                                <label htmlFor="template-file-replace" className="cursor-pointer">
                                  Change file
                                </label>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => onFileSelected(null)}
                                disabled={isOptimizing || uploadMutation.isPending}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>

                          <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                            <p className="truncate text-sm font-medium">{file.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB · HTML template
                            </p>
                          </div>

                          <p className="text-xs leading-relaxed text-muted-foreground">
                            Quick thumbnail preview helps confirm the selected design before upload.
                          </p>
                        </div>

                        <div className="relative overflow-hidden rounded-lg border border-border/70 bg-muted/20">
                          {uploadedFileHtml ? (
                            <div className="flex h-72 items-center justify-center p-3">
                              <div className="pointer-events-none h-full w-[205px] overflow-hidden rounded border border-border/70 bg-background shadow-sm">
                                <iframe
                                  title="Selected template thumbnail"
                                  srcDoc={uploadedFileHtml}
                                  className="h-[1120px] w-[794px] origin-top-left scale-[0.258]"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex h-full min-h-40 items-center justify-center gap-2 text-xs text-muted-foreground">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Preparing preview…
                            </div>
                          )}
                          {uploadedFileHtml ? (
                            <Button
                              type="button"
                              size="icon"
                              variant="secondary"
                              className="absolute bottom-2 right-2 h-7 w-7 shadow-sm"
                              onClick={() => setSelectedFilePreviewOpen(true)}
                              aria-label="Open large preview"
                            >
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-name" required>
                  Template name
                </Label>
                <Input
                  id="template-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Pro Invoice A4"
                />
              </div>

              <div className="space-y-2">
                <Label>Scope</Label>
                <Select
                  value={scope}
                  onValueChange={(v) => {
                    setScope(v as TemplateScope);
                    if (v === "PLATFORM") setOwnerBusinessId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLATFORM">All businesses</SelectItem>
                    <SelectItem value="ORG">Only one business</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Add as new version of</Label>
                <Select value={appendToTemplateId} onValueChange={setAppendToTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Create a new template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Create new template</SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select an existing template to add a version, or keep "Create new template".
                </p>
              </div>

              <div className="space-y-2">
                <Label>Owner business{scope === "ORG" ? " (required)" : " (optional)"}</Label>
                <Select
                  value={ownerBusinessId || "__none__"}
                  onValueChange={(v) => setOwnerBusinessId(v === "__none__" ? "" : v)}
                  disabled={scope !== "ORG"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Not selected</SelectItem>
                    {businesses.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.businessName} ({b.organizationCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {scope === "ORG" && (
                  <p className="text-xs text-muted-foreground">
                    Required for business-scoped templates.
                  </p>
                )}
              </div>

              {formError && (
                <div className="sm:col-span-2">
                  <FieldError>{formError}</FieldError>
                </div>
              )}

              <div className="sm:col-span-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={() => void onUpload()}
                    disabled={isOptimizing || uploadMutation.isPending}
                    className="gap-2"
                  >
                    {isOptimizing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Optimizing…
                      </>
                    ) : (
                      <>
                        <FileUp className="h-4 w-4" />
                        Upload &amp; optimize
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetUploadForm}
                    disabled={isOptimizing || uploadMutation.isPending}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </fieldset>

            {lastUploadResult && (
              <AiResultPanel
                result={lastUploadResult}
                onDismiss={() => setLastUploadResult(null)}
              />
            )}
          </CardContent>
        </Card>

        {/* ── Template library ─────────────────────────────────────── */}
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-muted/20">
            <CardTitle>Template library</CardTitle>
            <CardDescription>
              Load a preview, review AI diagnostics, publish, and assign — all in one place.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 p-4 sm:p-6">
            {templatesQuery.isPending ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-9 w-9 animate-spin text-muted-foreground" />
              </div>
            ) : templates.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="h-8 w-8" />}
                title="No templates yet"
                description="Upload your first HTML template above to start the AI optimization flow."
              />
            ) : (
              templates.map((template) => {
                const versions = templateVersionsSorted(template);
                return (
                  <details
                    key={template.id}
                    className="rounded-lg border border-border/70 bg-card shadow-sm open:border-primary/30"
                    open
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium">{template.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {template.scope}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {versions.length} version{versions.length !== 1 ? "s" : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void onUnassign(template);
                              }}
                              disabled={unassignMutation.isPending}
                              className="gap-1.5 text-muted-foreground"
                            >
                              {unassignMutation.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Unlink className="h-3.5 w-3.5" />
                              )}
                              Unlink
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Remove all platform/org assignments</TooltipContent>
                        </Tooltip>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setTemplateToDelete(template);
                          }}
                          disabled={deleteTemplateMutation.isPending}
                          className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Archive
                        </Button>
                      </div>
                    </summary>

                    <div className="space-y-2 border-t border-border/60 p-3 sm:p-4">
                      {versions.map((version) => {
                        const blockReason = publishBlockReason(version);
                        const canPublish = blockReason === null;
                        const isActive = activeVersionId === version.id;
                        const isLoadingPreview = loadingPreviewVersionId === version.id;
                        const isLoadingOriginal = loadingOriginalVersionId === version.id;

                        return (
                          <div
                            key={version.id}
                            className={cn(
                              "rounded-md border border-border/60 bg-muted/10 p-3 transition-colors",
                              isActive && "border-primary/40 bg-primary/5",
                            )}
                          >
                            {/* Version header row */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary">v{version.version}</Badge>
                                <Badge
                                  variant={version.status === "PUBLISHED" ? "default" : "outline"}
                                  className={cn(
                                    version.status === "PUBLISHED" &&
                                      "bg-emerald-600 text-white hover:bg-emerald-600",
                                  )}
                                >
                                  {version.status}
                                </Badge>
                                <QualityBadge score={version.qualityScore} />
                                {version.selectedModel && (
                                  <span className="hidden items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground sm:inline-flex">
                                    <BrainCircuit className="h-3 w-3" />
                                    {version.selectedModel}
                                  </span>
                                )}
                              </div>

                              {/* Action buttons */}
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant={isActive ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => {
                                    if (isActive) {
                                      setActiveVersionId(null);
                                      resetPreviewState();
                                    } else {
                                      void onLoadPreview(template.id, version.id);
                                    }
                                  }}
                                  disabled={isLoadingPreview}
                                  className="gap-1.5"
                                >
                                  {isLoadingPreview ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Sparkles className="h-3.5 w-3.5" />
                                  )}
                                  {isActive ? "Close preview" : "Load preview"}
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => void onReoptimize(template.id, version.id)}
                                  disabled={reoptimizeMutation.isPending}
                                  className="gap-1.5"
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                  Re-optimize
                                </Button>

                                {canPublish ? (
                                  <Button
                                    size="sm"
                                    onClick={() => void onPublish(template.id, version.id)}
                                    disabled={publishMutation.isPending}
                                    className="gap-1.5"
                                  >
                                    {publishMutation.isPending && (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    )}
                                    Publish
                                  </Button>
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button
                                          size="sm"
                                          disabled
                                          className="cursor-not-allowed gap-1.5"
                                        >
                                          Publish
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      className="max-w-[220px] text-center"
                                    >
                                      {blockReason}
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>

                            {/* AI Diagnostics */}
                            <VersionDiagnostics version={version} />

                            {/* Preview area */}
                            {isActive && (
                              <div className="mt-4 space-y-4 border-t border-border/60 pt-4">
                                {/* Preview tab bar */}
                                <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-1">
                                  {(["converted", "original", "compare"] as const).map((view) => (
                                    <button
                                      key={view}
                                      onClick={() => {
                                        setPreviewView(view);
                                        if (
                                          (view === "original" || view === "compare") &&
                                          !originalPreviewHtml &&
                                          !isLoadingOriginal
                                        ) {
                                          void onLoadOriginal(template.id, version.id);
                                        }
                                      }}
                                      className={cn(
                                        "flex-1 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-all",
                                        previewView === view
                                          ? "bg-background text-foreground shadow-sm"
                                          : "text-muted-foreground hover:text-foreground",
                                      )}
                                    >
                                      {view}
                                    </button>
                                  ))}
                                </div>

                                {/* Preview frame */}
                                {previewView === "compare" ? (
                                  <div className="grid gap-3 lg:grid-cols-2">
                                    <div>
                                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                                        Original upload
                                      </p>
                                      <div className="overflow-hidden rounded-md border border-border/70 bg-background">
                                        {isLoadingOriginal ? (
                                          <div className="flex h-64 items-center justify-center">
                                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                          </div>
                                        ) : originalPreviewHtml ? (
                                          <div className="overflow-x-auto">
                                            <iframe
                                              title="Original template"
                                              srcDoc={originalPreviewHtml}
                                              className="h-[68vh] min-h-[480px] w-[980px] max-w-none"
                                            />
                                          </div>
                                        ) : (
                                          <div className="flex h-64 items-center justify-center p-4 text-center text-sm text-muted-foreground">
                                            Original HTML not available
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div>
                                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                                        AI-converted preview
                                      </p>
                                      <div className="overflow-hidden rounded-md border border-border/70 bg-background">
                                        {renderedPreviewHtml ? (
                                          <div className="overflow-x-auto">
                                            <iframe
                                              title="Converted template"
                                              srcDoc={renderedPreviewHtml}
                                              className="h-[68vh] min-h-[480px] w-[980px] max-w-none"
                                            />
                                          </div>
                                        ) : (
                                          <div className="flex h-64 items-center justify-center p-4 text-center text-sm text-muted-foreground">
                                            Load preview first
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ) : previewView === "original" ? (
                                  <div className="overflow-hidden rounded-md border border-border/70 bg-background">
                                    {isLoadingOriginal ? (
                                      <div className="flex h-64 items-center justify-center">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                      </div>
                                    ) : originalPreviewHtml ? (
                                      <iframe
                                        title="Original uploaded template"
                                        srcDoc={originalPreviewHtml}
                                        className="h-[68vh] min-h-[480px] w-full"
                                      />
                                    ) : (
                                      <p className="p-6 text-center text-sm text-muted-foreground">
                                        Original HTML not available for this version.
                                      </p>
                                    )}
                                  </div>
                                ) : /* converted */ renderedPreviewHtml ? (
                                  <div className="overflow-hidden rounded-md border border-border/70 bg-background">
                                    <iframe
                                      title="AI-converted invoice preview"
                                      srcDoc={renderedPreviewHtml}
                                      className="h-[68vh] min-h-[480px] w-full"
                                    />
                                  </div>
                                ) : (
                                  <p className="rounded-md border border-border/70 p-6 text-center text-sm text-muted-foreground">
                                    Preview unavailable — click Load preview to retry.
                                  </p>
                                )}

                                {/* Assign section */}
                                <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
                                  <div className="mb-3 flex items-center gap-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                      Assign this version
                                    </p>
                                    {version.status !== "PUBLISHED" && (
                                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
                                        Publish first to enable assignment
                                      </span>
                                    )}
                                  </div>

                                  <fieldset
                                    disabled={
                                      version.status !== "PUBLISHED" || assignMutation.isPending
                                    }
                                    className="space-y-3"
                                  >
                                    <div className="flex items-center justify-between">
                                      <Label
                                        htmlFor={`platform-default-${version.id}`}
                                        className="text-sm"
                                      >
                                        Set as platform default
                                      </Label>
                                      <Switch
                                        id={`platform-default-${version.id}`}
                                        checked={setAsPlatformDefault}
                                        onCheckedChange={setSetAsPlatformDefault}
                                      />
                                    </div>

                                    {!setAsPlatformDefault && (
                                      <div className="space-y-2">
                                        <Label>Business</Label>
                                        <Select
                                          value={assignBusinessId}
                                          onValueChange={setAssignBusinessId}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select business" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {businesses.map((b) => (
                                              <SelectItem key={b.id} value={String(b.id)}>
                                                {b.businessName} ({b.organizationCode})
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}

                                    <Button
                                      onClick={() => void onAssign(version.id)}
                                      disabled={assignMutation.isPending}
                                      size="sm"
                                      className="gap-1.5"
                                    >
                                      {assignMutation.isPending && (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      )}
                                      Assign template
                                    </Button>
                                  </fieldset>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </details>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* ── Delete confirmation dialog ───────────────────────────── */}
        <AlertDialog
          open={templateToDelete !== null}
          onOpenChange={(open) => {
            if (!open) setTemplateToDelete(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive "{templateToDelete?.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the template from the active library. If it is currently assigned to a
                platform default or organization, use <strong>Unlink</strong> first — otherwise
                archiving will be blocked.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => void onDeleteConfirmed()}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Archive template
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={selectedFilePreviewOpen} onOpenChange={setSelectedFilePreviewOpen}>
          <DialogContent className="max-w-[min(96vw,1100px)]">
            <DialogHeader>
              <DialogTitle>Selected template preview</DialogTitle>
            </DialogHeader>
            {uploadedFileHtml ? (
              <div className="overflow-hidden rounded-md border border-border/70 bg-background">
                <iframe
                  title="Selected template large preview"
                  srcDoc={uploadedFileHtml}
                  className="h-[78vh] min-h-[540px] w-full"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Preview is no longer available.</p>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
