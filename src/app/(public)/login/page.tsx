import { redirect } from "next/navigation";
import { authRedirectPageMetadata } from "@/lib/site/seo-metadata";

export const metadata = authRedirectPageMetadata("Log in");

export default function LoginRedirectPage() {
  redirect("/?auth=login");
}
