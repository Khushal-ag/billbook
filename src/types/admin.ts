/** GET /admin/businesses — item shape from API */
export interface AdminBusinessListItem {
  id: number;
  businessName: string;
  ownerName: string | null;
  contactNo: string | null;
  joiningDate: string;
  validityEnd: string | null;
  organizationCode: string;
}

export interface AdminBusinessesResponse {
  items: AdminBusinessListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface ExtendValidityBody {
  additionalDays: number;
  remarks: string;
}
