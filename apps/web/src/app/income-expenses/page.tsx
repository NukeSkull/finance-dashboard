import { Suspense } from "react";
import { IncomeExpensesDetailPage } from "@/components/income-expenses-detail-page";

export default function IncomeExpensesPage() {
  return (
    <Suspense fallback={<main className="app-shell">Cargando vista...</main>}>
      <IncomeExpensesDetailPage />
    </Suspense>
  );
}
