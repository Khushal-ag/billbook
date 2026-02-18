import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

export function LandingFooter() {
  return (
    <footer className="border-t bg-muted/10">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo className="h-9 w-9" />
            <p className="mt-3 text-sm text-muted-foreground">
              A clean billing and GST workflow for day-to-day operations.
            </p>
            <div className="mt-4 flex gap-2">
              <Button asChild size="sm">
                <Link to="/?auth=signup">Start free</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/?auth=login">Sign in</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Product</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link className="hover:text-foreground" to="/?auth=signup">
                    Invoicing
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-foreground" to="/?auth=signup">
                    Reports
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-foreground" to="/?auth=signup">
                    Audit logs
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Company</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link className="hover:text-foreground" to="/?auth=signup">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-foreground" to="/?auth=signup">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-foreground" to="/?auth=signup">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Support</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link className="hover:text-foreground" to="/?auth=signup">
                    Help centre
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-foreground" to="/?auth=signup">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-foreground" to="/?auth=signup">
                    Book a demo
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} BillBook</span>
          <span>Professional, minimal, and built for B2B.</span>
        </div>
      </div>
    </footer>
  );
}
