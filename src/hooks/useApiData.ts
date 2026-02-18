import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  });

export function useApiData<T>(url: string | null) {
  const { data, error, isLoading, mutate } = useSWR<T>(url, fetcher, {
    revalidateOnFocus: false,
    errorRetryCount: 2,
    dedupingInterval: 30000,
  });

  return {
    data: data ?? null,
    error: error ? (error as Error).message : null,
    loading: isLoading,
    mutate,
  };
}
