import { useRouteError, useNavigate } from "react-router-dom";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function RouteErrorFallback() {
  const error = useRouteError();
  const navigate = useNavigate();

  const errorMessage =
    error instanceof Error ? error.message : "Unknown error";

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-6">
      <div className="max-w-md text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>

        <div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            頁面載入異常
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            很抱歉，頁面載入時發生了問題。請嘗試重新載入頁面。
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl border border-border text-foreground hover:bg-accent transition-colors"
          >
            <Home className="w-4 h-4" />
            返回首頁
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            重新載入
          </button>
        </div>

        {import.meta.env.DEV && (
          <details className="text-left mt-4 p-3 bg-muted rounded-xl">
            <summary className="text-xs text-muted-foreground cursor-pointer">
              Error Details
            </summary>
            <pre className="mt-2 text-xs text-destructive whitespace-pre-wrap break-all">
              {errorMessage}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
