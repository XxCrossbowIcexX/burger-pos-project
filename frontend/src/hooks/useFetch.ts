import { useEffect, useState } from "react";

export type ApiResponse<T> = {
  success: boolean;
  count?: number;
  data: T;
};

type ErrorType = Error | null;

interface Params<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useFetch = <T>(url: string): Params<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ErrorType>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const fetchData = async () => {
      try {
        const fullUrl = url.startsWith("http")
          ? url
          : `http://localhost:3000${url}`;
        const response = await fetch(fullUrl, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Error en la petición");
        }

        const jsonData: T = await response.json();
        setData(jsonData);
        setError(null);
      } catch (err) {
        // Ignorar errores de abort
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err as Error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [url, refetchTrigger]);

  return { data, loading, error, refetch };
};
