"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, generateIdempotencyKey } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { queryKeys } from "@/lib/query/keys";
import type {
  AssignTemplateData,
  AssignTemplateRequest,
  CompareTemplateData,
  DeleteTemplateData,
  InvoiceTemplate,
  PreviewTemplateData,
  PublishTemplateData,
  TemplateScope,
  UnassignTemplateData,
  UploadTemplateData,
} from "@/types/admin-invoice-template";

type UploadTemplateInput = {
  templateFile: File;
  name: string;
  scope?: TemplateScope;
  ownerBusinessId?: number;
  templateId?: number;
};

type ReoptimizeInput = {
  templateId: number;
  versionId?: number;
};

type PublishInput = {
  templateId: number;
  versionId?: number;
};

export function useAdminInvoiceTemplates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.admin.invoiceTemplates(),
    queryFn: async () => {
      const res = await api.get<InvoiceTemplate[]>("/admin/invoice-templates");
      return res.data;
    },
    enabled: user?.role === "ADMIN",
  });
}

export function useUploadInvoiceTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UploadTemplateInput) => {
      const form = new FormData();
      form.append("templateFile", input.templateFile);
      form.append("name", input.name.trim());
      if (input.scope) form.append("scope", input.scope);
      if (input.ownerBusinessId != null)
        form.append("ownerBusinessId", String(input.ownerBusinessId));
      if (input.templateId != null) form.append("templateId", String(input.templateId));
      const res = await api.postForm<UploadTemplateData>("/admin/invoice-templates/upload", form);
      return res.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.admin.invoiceTemplates() }),
  });
}

export function useReoptimizeInvoiceTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ templateId, versionId }: ReoptimizeInput) => {
      const body = versionId != null ? { versionId } : undefined;
      const res = await api.post<UploadTemplateData>(
        `/admin/invoice-templates/${templateId}/reoptimize`,
        body,
        generateIdempotencyKey(),
      );
      return res.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.admin.invoiceTemplates() }),
  });
}

export function usePublishInvoiceTemplateVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ templateId, versionId }: PublishInput) => {
      const body = versionId != null ? { versionId } : undefined;
      const res = await api.post<PublishTemplateData>(
        `/admin/invoice-templates/${templateId}/publish`,
        body,
        generateIdempotencyKey(),
      );
      return res.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.admin.invoiceTemplates() }),
  });
}

export function useDeleteInvoiceTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ templateId }: { templateId: number }) => {
      const res = await api.delete<DeleteTemplateData>(`/admin/invoice-templates/${templateId}`);
      return res.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.admin.invoiceTemplates() }),
  });
}

export function useAssignInvoiceTemplate() {
  return useMutation({
    mutationFn: async (input: AssignTemplateRequest) => {
      const res = await api.post<AssignTemplateData>(
        "/admin/invoice-templates/assign",
        input,
        generateIdempotencyKey(),
      );
      return res.data;
    },
  });
}

export function useInvoiceTemplatePreview() {
  return useMutation({
    mutationFn: async ({ templateId, versionId }: { templateId: number; versionId: number }) => {
      const res = await api.get<PreviewTemplateData>(
        `/admin/invoice-templates/${templateId}/versions/${versionId}/preview`,
      );
      return res.data;
    },
  });
}

export function useInvoiceTemplateCompare() {
  return useMutation({
    mutationFn: async ({ templateId, versionId }: { templateId: number; versionId: number }) => {
      const res = await api.get<CompareTemplateData>(
        `/admin/invoice-templates/${templateId}/versions/${versionId}/compare`,
      );
      return res.data;
    },
  });
}

export function useUnassignInvoiceTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ templateId }: { templateId: number }) => {
      const res = await api.delete<UnassignTemplateData>(
        `/admin/invoice-templates/${templateId}/assignments`,
      );
      return res.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.admin.invoiceTemplates() }),
  });
}
