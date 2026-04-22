import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticatedDashboard } from "@/components/authenticated-dashboard";
import { createMonthlySummary } from "@/test/factories";

const {
  replaceMock,
  getIdTokenMock,
  logoutMock,
  setLastDashboardSelectionMock,
  userMock,
  fetchMonthlySummaryMock,
  fetchNetWorthSummaryMock
} = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  getIdTokenMock: vi.fn(async () => "token"),
  logoutMock: vi.fn(),
  setLastDashboardSelectionMock: vi.fn(),
  userMock: { email: "test@example.com" },
  fetchMonthlySummaryMock: vi.fn(),
  fetchNetWorthSummaryMock: vi.fn()
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    replace: replaceMock
  })
}));

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => ({
    getIdToken: getIdTokenMock,
    loading: false,
    logout: logoutMock,
    user: userMock
  })
}));

vi.mock("@/features/settings/settings-provider", () => ({
  useSettings: () => ({
    lastDashboardSelection: null,
    setLastDashboardSelection: setLastDashboardSelectionMock,
    settings: {
      confirmBeforeLogout: false,
      defaultDashboardPeriodMode: "current_month",
      numberFormatLocale: "es-ES",
      showNetWorthOnHome: false,
      showQuickAddOnHome: false
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
          savings: -100,
          totalExpenses: 2100
        })
      )
      .mockResolvedValueOnce(
        createMonthlySummary({
          discretionaryExpenses: 400,
          essentialExpenses: 850,
          income: 2300,
          month: 3,
          savings: 550,
          totalExpenses: 1250
        })
      );
  });

  it("muestra senales destacables con prioridad y sin navegacion duplicada inferior", async () => {
    render(<AuthenticatedDashboard />);

    expect(await screen.findByText(/Senales del periodo|Señales del periodo/i)).toBeInTheDocument();
    expect(
      screen.getByText(/El gasto total supera a los ingresos del periodo/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/El ahorro del periodo es negativo/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Actividad reciente" })
    ).not.toBeInTheDocument();

    const cards = screen.getAllByRole("link");
    expect(cards.some((item) => item.textContent?.includes("Actividad"))).toBe(true);
  });

  it("carga tambien el mes anterior para calcular comparativas", async () => {
    render(<AuthenticatedDashboard />);

    await waitFor(() => expect(fetchMonthlySummaryMock).toHaveBeenCalledTimes(2));
    expect(fetchMonthlySummaryMock.mock.calls[1][0]).toMatchObject({
      month: expect.any(Number),
      token: "token",
      year: expect.any(Number)
    });
  });
});
