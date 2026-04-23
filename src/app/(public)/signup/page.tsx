import { redirect } from "next/navigation";
import { authRedirectPageMetadata } from "@/lib/site/seo-metadata";

export const metadata = authRedirectPageMetadata("Sign up");

export default function SignupRedirectPage() {
  redirect("/?auth=signup");
}
