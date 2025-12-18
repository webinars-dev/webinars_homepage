import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth.jsx';

export function useAdminRole() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (authLoading) {
        setLoading(true);
        return;
      }

      if (!supabase || !user) {
        setIsAdmin(false);
        setLoading(false);
        setError(null);
        return;
      }

      const appRole = user?.app_metadata?.role;
      if (appRole === 'admin') {
        setIsAdmin(true);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from('authors')
          .select('role')
          .eq('id', user.id)
          .limit(1);

        if (queryError) throw queryError;

        const role = (data?.[0]?.role || '').toLowerCase();

        if (cancelled) return;
        setIsAdmin(role === 'admin');
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setIsAdmin(false);
        setLoading(false);
        setError(err);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id]);

  return { isAdmin, loading, error };
}

