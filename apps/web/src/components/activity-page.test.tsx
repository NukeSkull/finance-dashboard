import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActivityPage } from "@/components/activity-page";
import {
  createAssetOperationsResponse,
  createIncomeExpensesDetail
} from "@/test/factories";

const {
  replaceMock,
  getIdTokenMock,
  userMock,
  fetchIncomeExpensesDetailMock,
  fetchAssetPurchasesMock,
  fetchAssetSalesMock
} = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  getIdTokenMock: vi.fn(async () => "token"),
  userMock: { email: "test@example.com" },
  fetchIncomeExpensesDetailMock: vi.fn(),
  fetchAssetPurchasesMock: vi.fn(),
  fetchAssetSalesMock: vi.fn()
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/activity",
  useRouter: () => ({
    replace: replaceMock
  }),
  useSearchParams: () =>
    new URLSearchParams({
      dateFrom: "2026-01-01",
      dateTo: "2026-04-30",
      month: "4",
      year: "2026"
    })
}));

vi.mock("@/components/authenticated-app-shell", () => ({
  AuthenticatedAppShell: ({ children }: { children: ReactNode }) => <div>{children}</div>
}));

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => ({
    getIdToken: getIdTokenMock,
    loading: false,
    user: userMock
  })
}));

vi.mock("@/features/app-shell/app-shell-provider", () => ({
  useAppShell: () => ({
    lastQuickAddResult: null,
    quickAddVersion: 0
  })
}));

vi.mock("@/features/settings/settings-provider", () => ({
  useSettings: () => ({
    globalMonthSelection: { month: 4, year: 2026 },
    setGlobalMonthSelection: vi.fn(),
    settings: {
      confirmBeforeLogout: false,
      defaultSectionDateRange: "last_90_days",
      numberFormatLocale: "es-ES",
      rememberLastVisitedVtTab: true,
      showSectionCardsCompletedOnly: false
    }
  })
}));

vi.mock("@/lib/api/client", () => ({
  fetchAssetPurchases: fetchAssetPurchasesMock,
  fetchAssetSales: fetchAssetSalesMock,
  fetchIncomeExpensesDetail: fetchIncomeExpensesDetailMock
}));

describe("ActivityPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchIncomeExpensesDetailMock.mockResolvedValue(createIncomeExpensesDetail());
    fetchAssetPurchasesMock.mockResolvedValue(
      createAssetOperationsResponse({
        items: [
          {
            date: "2026-04-15",
            dateSerial: 46027,
            feesEur: null,
            feesUsd: null,
            platform: "Trade Republic",
            product: "ETF MSCI World",
            quantity: 2,
            totalEur: 180,
            totalUsd: null,
            unitPriceEur: 90,
            unitPriceUsd: null
          }
        ]
      })
    );
    fetchAssetSalesMock.mockResolvedValue(
      createAssetOperationsResponse({
        items: [
          {
            date: "2026-04-20",
            dateSerial: 46032,
            feesEur: null,
            feesUsd: null,
            platform: "Trade Republic",
            product: "ETF Emergentes",
            quantity: 1,
            totalEur: 95,
            totalUsd: null,
            unitPriceEur: 95,
            unitPriceUsd: null
          }
        ],
        operationType: "sale",
        sheetName: "Ventas",
        summary: {
          count: 1,
          totalEur: 95,
          totalUsd: null
        }
      })
    );
  });

  it("muestra una timeline combinada de ingresos, gastos y operaciones", async () => {
    render(<ActivityPage />);

    expect(await screen.findByText(/Actividad combinada/i)).toBeInTheDocument();
    expect(screen.getByText(/ETF Emergentes/i)).toBeInTheDocument();
    expect(screen.getByText("Compra · Trade Republic")).toBeInTheDocument();
    expect(screen.getAllByText(/Ingreso mensual/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Gasto mensual/i).length).toBeGreaterThan(0);
  });

  it("llama a los tres endpoints necesarios para construir la vista", async () => {
    render(<ActivityPage />);

    await waitFor(() => {
      expect(fetchIncomeExpensesDetailMock).toHaveBeenCalledTimes(1);
      expect(fetchAssetPurchasesMock).toHaveBeenCalledTimes(1);
      expect(fetchAssetSalesMock).toHaveBeenCalledTimes(1);
    });
  });
});
