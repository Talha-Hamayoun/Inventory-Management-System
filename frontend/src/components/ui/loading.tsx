import { Loader2 } from "lucide-react";

export function LoadingSpinner({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const sizes = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className={`${sizes[size]} animate-spin text-blue-600`} />
    </div>
  );
}

// Alias for backward compatibility
export const Loading = LoadingSpinner;

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-100">
      <LoadingSpinner size="lg" />
    </div>
  );
}
