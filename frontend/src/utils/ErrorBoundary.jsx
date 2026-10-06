"use client";

import { ErrorBoundary, getErrorMessage } from "react-error-boundary";

function DefaultFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" style={{ padding: "1rem", textAlign: "center" }}>
      <p>Something went wrong:</p>
      <pre>{getErrorMessage(error)}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

export default function AppErrorBoundary({
  children,
  fallback,
  onError,
  resetKeys,
}) {
  return (
    <ErrorBoundary
      FallbackComponent={fallback || DefaultFallback}
      onError={(error, info) => {
        console.error("ErrorBoundary caught:", error, info);
        onError?.(error, info); // Sentry etc. yahan hook karo
      }}
      resetKeys={resetKeys}
    >
      {children}
    </ErrorBoundary>
  );
}