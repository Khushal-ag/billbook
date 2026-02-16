import { Link, useNavigate } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

const NotFound = () => {
  const navigate = useNavigate();

  // In production, you could log this to an error tracking service
  // Example: Sentry.captureMessage(`404 Error: ${_location.pathname}`)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="animate-fade-in text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Logo className="h-16 w-16" showText={false} />
        </div>

        {/* 404 */}
        <div className="mb-6">
          <h1 className="mb-2 text-8xl font-extrabold tracking-tight">
            <span className="gradient-text">404</span>
          </h1>
          <div className="mx-auto h-1 w-24 rounded-full bg-gradient-to-r from-primary to-accent"></div>
        </div>

        {/* Message */}
        <h2 className="mb-3 text-2xl font-bold text-foreground">Page not found</h2>
        <p className="mb-8 max-w-md text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link to="/dashboard">
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>

        {/* Decorative elements */}
        <div className="mt-12 flex justify-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary/60"></div>
          <div className="animation-delay-200 h-2 w-2 animate-pulse rounded-full bg-accent/60"></div>
          <div className="animation-delay-400 h-2 w-2 animate-pulse rounded-full bg-primary/60"></div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
