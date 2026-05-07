import { useState } from "react";

export function useMapError() {
  const [error, setError] = useState<string | null>(null);
  const clearError = () => setError(null);

  return { error, setError, clearError };
}