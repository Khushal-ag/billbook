export type TemplateScope = "PLATFORM" | "ORG";
export type TemplateVersionStatus = "DRAFT" | "PUBLISHED";

export interface TemplateVersion {
  id: number;
  version: number;
  status: TemplateVersionStatus;
  qualityScore?: number;
  selectedModel?: string | null;
  validationWarnings: string[];
  validationErrors: string[];
  aiNotes?: string | null;
  previewUrl?: string | null;
  createdAt?: string;
}

export interface InvoiceTemplate {
  id: number;
  name: string;
  slug: string;
  scope: TemplateScope;
  ownerBusinessId?: number | null;
  createdBy?: number | null;
  createdAt?: string;
  updatedAt?: string;
  versions: TemplateVersion[];
}

export interface UploadTemplateData {
  templateId: number;
  versionId: number;
  version: number;
  status: TemplateVersionStatus;
  qualityScore?: number;
  selectedModel?: string | null;
  validationWarnings?: string[];
  validationErrors?: string[];
  aiNotes?: string | null;
  previewUrl?: string | null;
  createdAt?: string;
  reoptimizedFromVersionId?: number;
}

export interface PublishTemplateData {
  templateId: number;
  versionId: number;
  version: number;
  status: "PUBLISHED";
}

export interface DeleteTemplateData {
  templateId: number;
  isArchived?: boolean;
  alreadyArchived?: boolean;
}

export interface AssignTemplateRequest {
  templateVersionId: number;
  businessId?: number;
  setAsPlatformDefault: boolean;
}

export interface AssignTemplateData {
  templateVersionId: number;
  businessId: number | null;
  scope: "BUSINESS" | "PLATFORM";
}

export interface PreviewTemplateData {
  templateId: number;
  versionId: number;
  previewUrl: string;
}

export interface CompareTemplateData {
  templateId: number;
  versionId: number;
  originalTemplateUrl: string | null;
  transformedTemplateUrl: string | null;
  renderedPreviewUrl: string | null;
}

export interface UnassignTemplateData {
  templateId: number;
  unassignedCount: number;
}
