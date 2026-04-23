import { redirect } from "next/navigation";
import { authRedirectPageMetadata } from "@/lib/site/seo-metadata";

export const metadata = authRedirectPageMetadata("Forgot password");

export default function ForgotPasswordRedirectPage() {
  redirect("/?auth=forgot");
}
