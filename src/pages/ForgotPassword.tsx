import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPassword() {
  return (
    <AuthLayout>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-lg">Reset your password</CardTitle>
          <CardDescription>
            This feature is coming soon. Please contact your administrator to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link to="/login" className="text-sm font-medium text-accent hover:underline">
            Back to login
          </Link>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
