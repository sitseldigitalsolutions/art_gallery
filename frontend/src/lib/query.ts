import { QueryClient } from '@tanstack/react-query';
import axios from 'axios';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: (count, err) => {
        if (axios.isAxiosError(err) && err.response && err.response.status < 500) return false;
        return count < 2;
      },
    },
  },
});
