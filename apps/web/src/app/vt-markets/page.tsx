import { Suspense } from "react";
import { VtMarketsPage } from "@/components/vt-markets-page";

export default function VtMarketsRoutePage() {
  return (
    <Suspense fallback={<main className="app-shell">Cargando vista...</main>}>
      <VtMarketsPage />
    </Suspense>
  );
}
