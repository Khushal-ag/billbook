import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ForgotPasswordCardProps = {
  onBackToLogin?: () => void;
};

export default function ForgotPasswordCard({ onBackToLogin }: ForgotPasswordCardProps) {
  return (
    <Card>
      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-lg">Reset your password</CardTitle>
        <CardDescription>
          This feature is coming soon. Please contact your administrator to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Button type="button" variant="outline" onClick={onBackToLogin}>
          Back to sign in
        </Button>
      </CardContent>
    </Card>
  );
}
