import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IncomeExpensesDetailPage } from "@/components/income-expenses-detail-page";
import {
  createIncomeExpensesDetail,
  createIncomeExpensesYearContext
} from "@/test/factories";

const {
  replaceMock,
  getIdTokenMock,
  userMock,
  fetchIncomeExpensesDetailMock,
  fetchIncomeExpensesYearContextMock
} = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  getIdTokenMock: vi.fn(async () => "token"),
  userMock: { email: "test@example.com" },
  fetchIncomeExpensesDetailMock: vi.fn(),
  fetchIncomeExpensesYearContextMock: vi.fn()
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/income-expenses",
  useRouter: () => ({
    replace: replaceMock
  }),
  useSearchParams: () =>
    new URLSearchParams({
      month: "4",
      year: "2026"
    })
}));

vi.mock("echarts-for-react", () => ({
  default: () => <div>Income expenses year chart</div>
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
  fetchIncomeExpensesDetail: fetchIncomeExpensesDetailMock,
  fetchIncomeExpensesYearContext: fetchIncomeExpensesYearContextMock
}));

describe("IncomeExpensesDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchIncomeExpensesDetailMock.mockResolvedValue(
      createIncomeExpensesDetail({
        essentialExpensesSection: {
          items: [
            { label: "Alquiler", row: 17, value: 700 },
            { label: "Luz", row: 18, value: 0 },
            { label: "Supermercado", row: 19, value: 250 }
          ],
          title: "Gastos vitales",
          total: 950,
          totalLabel: "Total gastos vitales"
        }
      })
    );
    fetchIncomeExpensesYearContextMock.mockResolvedValue(createIncomeExpensesYearContext());
  });

  it("renderiza kpis, contexto anual y grafico principal", async () => {
    render(<IncomeExpensesDetailPage />);

    expect(await screen.findByText(/encaja este mes en el/i)).toBeInTheDocument();
    expect(screen.getByText(/Income expenses year chart/i)).toBeInTheDocument();

    const kpiGrid = screen.getByLabelText(/KPIs del mes/i);
    expect(within(kpiGrid).getByText(/^Ingresos$/i)).toBeInTheDocument();
    expect(within(kpiGrid).getByText(/^Gastos vitales$/i)).toBeInTheDocument();
    expect(within(kpiGrid).getByText(/^Gastos extra$/i)).toBeInTheDocument();
    expect(within(kpiGrid).getByText(/^Gasto total$/i)).toBeInTheDocument();
    expect(within(kpiGrid).getByText(/^Ahorro del mes$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/media acumulada del a[nñ]o/i)).toHaveLength(2);
  });

  it("carga detalle mensual y contexto anual en paralelo", async () => {
    render(<IncomeExpensesDetailPage />);

    await waitFor(() => {
      expect(fetchIncomeExpensesDetailMock).toHaveBeenCalledTimes(1);
      expect(fetchIncomeExpensesYearContextMock).toHaveBeenCalledTimes(1);
    });
  });

  it("oculta categorias con importe 0 por defecto y permite mostrarlas", async () => {
    const user = userEvent.setup();

    render(<IncomeExpensesDetailPage />);

    expect(await screen.findByText(/Supermercado/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Luz$/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /mostrar tambien categorias vacias/i }));

    expect(screen.getByText(/^Luz$/i)).toBeInTheDocument();
  });

  it("permite ordenar categorias por importe descendente", async () => {
    const user = userEvent.setup();

    render(<IncomeExpensesDetailPage />);

    expect(await screen.findByText(/Alquiler/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/^Orden$/i), "amount_desc");

    const sectionHeading = screen.getByRole("heading", { name: /Gastos vitales/i });
    const section = sectionHeading.closest("section");

    expect(section).not.toBeNull();

    const rows = within(section as HTMLElement).getAllByRole("row");
    expect(rows[1]).toHaveTextContent(/Alquiler/i);
    expect(rows[2]).toHaveTextContent(/Supermercado/i);
  });
});
