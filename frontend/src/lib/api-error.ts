/**
 * Type-safe error shape for Axios API errors.
 * Use `(err as ApiError)` in catch blocks instead of `catch (e: any)`.
 */
export interface ApiError {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

/**
 * Extract error message from an unknown error, typically an Axios error.
 */
export function getErrorMessage(err: unknown, fallback = "Xatolik yuz berdi"): string {
  const apiErr = err as ApiError;
  return (
    apiErr?.response?.data?.message ||
    apiErr?.response?.data?.error ||
    apiErr?.message ||
    fallback
  );
}
