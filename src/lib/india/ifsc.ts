export type IfscLookupResult = {
  BANK: string;
  BRANCH: string;
  ADDRESS: string;
  CITY: string;
  DISTRICT: string;
  STATE: string;
  MICR: string;
  NEFT: boolean;
  RTGS: boolean;
  IMPS: boolean;
  UPI: boolean;
};

export async function lookupIfscCode(ifscCode: string): Promise<IfscLookupResult> {
  const normalizedCode = ifscCode.trim().toUpperCase();
  if (!/^[A-Z0-9]{11}$/.test(normalizedCode)) {
    throw new Error("Enter a valid 11-character IFSC code.");
  }

  const response = await fetch(`https://ifsc.razorpay.com/${normalizedCode}`);

  if (response.status === 404) {
    throw new Error("Invalid IFSC code. Please check and try again.");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch bank details. Please try again.");
  }

  const data = (await response.json()) as Partial<IfscLookupResult>;

  return {
    BANK: String(data.BANK ?? ""),
    BRANCH: String(data.BRANCH ?? ""),
    ADDRESS: String(data.ADDRESS ?? ""),
    CITY: String(data.CITY ?? ""),
    DISTRICT: String(data.DISTRICT ?? ""),
    STATE: String(data.STATE ?? ""),
    MICR: String(data.MICR ?? ""),
    NEFT: Boolean(data.NEFT),
    RTGS: Boolean(data.RTGS),
    IMPS: Boolean(data.IMPS),
    UPI: Boolean(data.UPI),
  };
}
