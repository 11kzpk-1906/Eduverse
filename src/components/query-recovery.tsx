import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function QueryRecovery({ retry }: { retry: () => void }) {
  return <div role="alert" className="flex flex-wrap items-center gap-3 border border-destructive/30 bg-destructive/10 p-4">
    <p className="flex-1 text-sm">We couldn’t load your data. Please try again.</p>
    <Button variant="outline" onClick={retry}><RefreshCw className="h-4 w-4" />Try again</Button>
  </div>;
}