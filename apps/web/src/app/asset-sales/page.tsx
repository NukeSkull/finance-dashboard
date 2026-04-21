import { Suspense } from "react";
import { AssetOperationsPage } from "@/components/asset-operations-page";

export default function AssetSalesPage() {
  return (
    <Suspense fallback={<main className="app-shell">Cargando vista...</main>}>
      <AssetOperationsPage kind="sale" />
    </Suspense>
  );
}
