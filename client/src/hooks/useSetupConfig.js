import { useState, useEffect } from 'react';
import api from '../utils/api';

// Module-level cache — avoids repeat API calls across components in the same session
const cache = {};

const useSetupConfig = (category) => {
  const [items, setItems] = useState(cache[category] || []);
  const [loading, setLoading] = useState(!cache[category]);

  useEffect(() => {
    if (cache[category]) {
      setItems(cache[category]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    api.get(`/setup-config/${category}`)
      .then((res) => {
        if (cancelled) return;
        const data = res.data.data || [];
        cache[category] = data;
        setItems(data);
      })
      .catch(() => {
        // Silently fall back to empty — parent components keep hardcoded fallbacks
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [category]);

  // Convenience: array of name strings (what most selects need)
  const names = items.map((i) => i.name);

  // True if "Other" is one of the configured options
  const hasOther = names.includes('Other');

  return { items, names, hasOther, loading };
};

export default useSetupConfig;
