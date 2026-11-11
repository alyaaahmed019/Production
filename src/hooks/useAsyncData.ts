import { useCallback, useEffect, useRef, useState } from 'react';

interface AsyncState<T> {
  data?: T;
  error?: Error;
  /** True while the first load (or a reload) is in flight. Existing data stays available. */
  loading: boolean;
}

/** Minimal data-fetching hook: loading / error / reload, with stale-response protection. */
export function useAsyncData<T>(fetcher: () => Promise<T>, deps: readonly unknown[] = []) {
  const [state, setState] = useState<AsyncState<T>>({ loading: true });
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setState((previous) => ({ data: previous.data, loading: true }));
    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false });
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        const error = reason instanceof Error ? reason : new Error(String(reason));
        setState((previous) => ({ data: previous.data, error, loading: false }));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  const reload = useCallback(() => setTick((value) => value + 1), []);
  return { ...state, reload };
}
