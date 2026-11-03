import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";

const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then(({ DashboardPage }) => ({
    default: DashboardPage,
  })),
);

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Suspense
        fallback={
          <main className="grid min-h-screen place-items-center bg-ink text-mist">
            Chargement…
          </main>
        }
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard/:id" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
