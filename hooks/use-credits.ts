import { useState, useEffect } from 'react';

export function useCredits() {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCredits() {
      try {
        const response = await fetch('/api/user/credits');
        const data = await response.json();
        setCredits(data.credits);
      } catch (error) {
        console.error('Failed to sync credits:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCredits();
  }, []);

  return { credits, loading };
}
