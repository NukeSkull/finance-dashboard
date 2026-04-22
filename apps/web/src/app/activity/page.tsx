import { Suspense } from "react";
import { ActivityPage } from "@/components/activity-page";

export default function ActivityRoute() {
  return (
    <Suspense fallback={<main className="app-shell">Cargando vista...</main>}>
      <ActivityPage />
    </Suspense>
  );
}
