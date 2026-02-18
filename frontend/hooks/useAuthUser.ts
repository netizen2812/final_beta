
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from 'https://esm.sh/@supabase/supabase-js@^2.48.1';

export const useAuthUser = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return user;
};
