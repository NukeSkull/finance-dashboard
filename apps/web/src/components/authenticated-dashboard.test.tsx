import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticatedDashboard } from "@/components/authenticated-dashboard";
import {
  createMonthlySummary,
  createNetWorthSummary
} from "@/test/factories";

const {
  getIdTokenMock,
  userMock,
  fetchMonthlySummaryMock,
  fetchNetWorthSummaryMock
} = vi.hoisted(() => ({
  getIdTokenMock: vi.fn(async () => "token"),
  userMock: { email: "test@example.com" },
  fetchMonthlySummaryMock: vi.fn(),
  fetchNetWorthSummaryMock: vi.fn()
}));

vi.mock("@/components/authenticated-app-shell", () => ({
  AuthenticatedAppShell: ({ children }: { children: ReactNode }) => <div>{children}</div>
}));

vi.mock("@/components/charts/donut-chart", () => ({
  DonutChart: () => <div>Donut chart</div>
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
  fetchMonthlySummary: fetchMonthlySummaryMock,
  fetchNetWorthSummary: fetchNetWorthSummaryMock
}));

describe("AuthenticatedDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMonthlySummaryMock
      .mockResolvedValueOnce(
        createMonthlySummary({
          discretionaryExpenses: 1200,
          essentialExpenses: 900,
          income: 2000,
          invested: 300,
          savings: -100,
          totalExpenses: 2100
        })
      )
      .mockResolvedValueOnce(
        createMonthlySummary({
          discretionaryExpenses: 400,
          essentialExpenses: 850,
          income: 2300,
          invested: 250,
          month: 3,
          savings: 550,
          totalExpenses: 1250
        })
      );
    fetchNetWorthSummaryMock.mockResolvedValue(createNetWorthSummary());
  });

  it("renderiza el hero de patrimonio, los cuatro kpis y las señales compactas", async () => {
    render(<AuthenticatedDashboard />);

    expect(await screen.findByText(/Bancos/i)).toBeInTheDocument();
    expect(screen.getByText(/Donut chart/i)).toBeInTheDocument();
    const kpiRegion = screen.getByRole("region", { name: /kpis mensuales/i });
    expect(within(kpiRegion).getByText(/^Ingresos$/i)).toBeInTheDocument();
    expect(within(kpiRegion).getByText(/^Gasto total$/i)).toBeInTheDocument();
    expect(within(kpiRegion).getByText(/^Invertido$/i)).toBeInTheDocument();
    expect(within(kpiRegion).getByText(/^Ahorro del mes$/i)).toBeInTheDocument();
    expect(
      screen.getByText(/El gasto total supera a los ingresos del periodo/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/El ahorro del periodo es negativo/i)).toBeInTheDocument();
  });

  it("carga resumen actual, mes anterior y patrimonio global", async () => {
    render(<AuthenticatedDashboard />);

    await waitFor(() => {
      expect(fetchMonthlySummaryMock).toHaveBeenCalledTimes(2);
      expect(fetchNetWorthSummaryMock).toHaveBeenCalledTimes(1);
    });
  });
});
