import { MonitorSmartphone } from "lucide-react";
import { useUIMode, type UIMode } from "@/contexts/UIModeContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function InterfaceModeCard() {
  const { mode, setMode } = useUIMode();

  return (
    <Card className="overflow-hidden border-dashed">
      <CardHeader className="border-b bg-muted/30 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm ring-1 ring-border">
            <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-base">Personal display</CardTitle>
            <CardDescription className="mt-1">
              Only affects your account — not part of business settings shared with the team.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-4">
          <RadioGroup value={mode} onValueChange={(value) => setMode(value as UIMode)}>
            <div
              className="flex cursor-pointer items-start space-x-3 rounded-xl border p-4 transition-colors hover:bg-muted/40"
              onClick={() => setMode("simple")}
            >
              <RadioGroupItem value="simple" id="mode-simple" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="mode-simple" className="cursor-pointer font-medium leading-tight">
                  Simple mode
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Essential features only — easier to get started.
                </p>
              </div>
            </div>

            <div
              className="flex cursor-pointer items-start space-x-3 rounded-xl border p-4 transition-colors hover:bg-muted/40"
              onClick={() => setMode("advanced")}
            >
              <RadioGroupItem value="advanced" id="mode-advanced" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="mode-advanced" className="cursor-pointer font-medium leading-tight">
                  Advanced mode
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Full tools: reports, tax, credit notes, and more.
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <p className="text-xs text-muted-foreground">
          You can switch anytime. Your data is unchanged.
        </p>
      </CardContent>
    </Card>
  );
}
