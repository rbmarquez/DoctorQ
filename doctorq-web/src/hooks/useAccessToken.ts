// hooks/useAccessToken.ts

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function useAccessToken() {
  const { data: session } = useSession();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      if (session?.user) {
        try {
          // Buscar o token do servidor quando necessário
          const response = await fetch("/api/auth/token");
          if (response.ok) {
            const data = await response.json();
            setAccessToken(data.accessToken);
          }
        } catch (error) {
          console.error("Error fetching access token:", error);
        }
      }
      setLoading(false);
    };

    fetchToken();
  }, [session]);

  return { accessToken, loading };
}
