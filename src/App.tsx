import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { TalaProvider } from "@/components/tala/TalaContext";
import TodayPage from "@/pages/TodayPage";
import ExplorePage from "@/pages/ExplorePage";
import TripPage from "@/pages/TripPage";
import PulsePage from "@/pages/PulsePage";
import PlaceDetailPage from "@/pages/PlaceDetailPage";
import { lazy, Suspense } from "react";

const AdminPage = lazy(() => import("@/pages/admin/AdminPage"));

export default function App() {
  return (
    <BrowserRouter>
      <TalaProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<TodayPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/trip" element={<TripPage />} />
            <Route path="/pulse" element={<PulsePage />} />
            <Route path="/place/:slug" element={<PlaceDetailPage />} />
            <Route
              path="/admin"
              element={
                <Suspense fallback={null}>
                  <AdminPage />
                </Suspense>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </TalaProvider>
    </BrowserRouter>
  );
}
