import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Logo from "@/components/Logo";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link to="/" className="transition-opacity hover:opacity-90" aria-label="BillBook home">
            <Logo className="h-9 w-9" />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  Features
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link to="/?auth=signup">Invoicing & credit notes</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/?auth=signup">GST / tax summaries</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/?auth=signup">Audit logs</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  Solutions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link to="/?auth=signup">For owners</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/?auth=signup">For teams</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/?auth=signup">For accountants</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button asChild variant="ghost" size="sm">
              <Link to="/?auth=signup">Pricing</Link>
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/?auth=login">Sign in</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link to="/?auth=signup">Book a demo</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/?auth=signup">Start free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
