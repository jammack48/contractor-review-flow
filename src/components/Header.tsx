
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">RR</span>
              </div>
              <h1 className="text-2xl font-bold">Review Rocket</h1>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Demo Mode
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              Connect Xero
            </Button>
            <Button variant="outline" size="sm">
              Settings
            </Button>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-sm font-medium">U</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
