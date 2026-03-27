import { useCallback, useState } from "react";

export function useAsync(asyncFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = useCallback(
    async (...args) => {
      setLoading(true);
      setError("");
      try {
        const result = await asyncFn(...args);
        return result;
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "Something went wrong");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [asyncFn]
  );

  return { run, loading, error, setError };
}
