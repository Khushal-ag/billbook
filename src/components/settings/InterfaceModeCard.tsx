import { useUIMode, type UIMode } from "@/contexts/UIModeContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function InterfaceModeCard() {
  const { mode, setMode } = useUIMode();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Interface Mode</CardTitle>
        <CardDescription>
          Choose how BillBook displays features to match your comfort level
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <RadioGroup value={mode} onValueChange={(value) => setMode(value as UIMode)}>
            <div
              className="flex cursor-pointer items-start space-x-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              onClick={() => setMode("simple")}
            >
              <RadioGroupItem value="simple" id="mode-simple" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="mode-simple" className="cursor-pointer font-medium leading-tight">
                  Simple Mode
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Streamlined interface with essential features only. Perfect for getting started or
                  if you prefer a less cluttered experience.
                </p>
              </div>
            </div>

            <div
              className="flex cursor-pointer items-start space-x-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              onClick={() => setMode("advanced")}
            >
              <RadioGroupItem value="advanced" id="mode-advanced" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="mode-advanced" className="cursor-pointer font-medium leading-tight">
                  Advanced Mode
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Full-featured interface with all tools and options. Best for power users who need
                  complete control.
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">
            💡 You can switch modes anytime. No data will be lost when changing modes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
