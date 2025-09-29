import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner"; // add toaster for alerts
import AlertsListener from "@/components/dashboard/AlertsListener.jsx"; // global alerts polling

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Global toast portal and alert listener */}
      <Toaster position="top-right" richColors />
      <AlertsListener />
    </QueryClientProvider>
  );
}
