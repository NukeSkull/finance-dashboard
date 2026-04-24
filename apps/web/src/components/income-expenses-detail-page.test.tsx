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
  fetchIncomeExpensesYearContextMock,
  echartsPropsMock
} = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  getIdTokenMock: vi.fn(async () => "token"),
  userMock: { email: "test@example.com" },
  fetchIncomeExpensesDetailMock: vi.fn(),
  fetchIncomeExpensesYearContextMock: vi.fn(),
  echartsPropsMock: vi.fn()
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
  default: (props: unknown) => {
    echartsPropsMock(props);
    return <div>Income expenses year chart</div>;
  }
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
    privacyModeEnabled: false,
    setGlobalMonthSelection: vi.fn(),
    setPrivacyModeEnabled: vi.fn(),
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
    expect(within(kpiGrid).getByText(/^Inversion del mes$/i)).toBeInTheDocument();
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
    expect(
      screen.getByRole("button", { name: /ocultando categorias vacias/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /ocultando categorias vacias/i }));

    expect(screen.getByText(/^Luz$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /mostrando todas/i })).toBeInTheDocument();
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

  it("mantiene visibles los meses posteriores con datos al seleccionar un mes anterior", async () => {
    fetchIncomeExpensesYearContextMock.mockResolvedValue(
      createIncomeExpensesYearContext({
        monthly: [
          {
            discretionaryExpenses: 180,
            essentialExpenses: 760,
            income: 2200,
            invested: 180,
            month: 1,
            savings: 840,
            totalExpenses: 940
          },
          {
            discretionaryExpenses: 240,
            essentialExpenses: 790,
            income: 2250,
            invested: 200,
            month: 2,
            savings: 720,
            totalExpenses: 1030
          },
          {
            discretionaryExpenses: 210,
            essentialExpenses: 780,
            income: 2350,
            invested: 220,
            month: 3,
            savings: 760,
            totalExpenses: 990
          },
          {
            discretionaryExpenses: 300,
            essentialExpenses: 950,
            income: 2600,
            invested: 260,
            month: 4,
            savings: 650,
            totalExpenses: 1250
          },
          {
            discretionaryExpenses: 280,
            essentialExpenses: 900,
            income: 2500,
            invested: 240,
            month: 5,
            savings: 700,
            totalExpenses: 1180
          },
          {
            discretionaryExpenses: 260,
            essentialExpenses: 870,
            income: 2450,
            invested: 230,
            month: 6,
            savings: 710,
            totalExpenses: 1130
          },
          ...Array.from({ length: 6 }, (_, index) => ({
            discretionaryExpenses: 0,
            essentialExpenses: 0,
            income: 0,
            invested: 0,
            month: index + 7,
            savings: 0,
            totalExpenses: 0
          }))
        ],
        selectedMonth: 4
      })
    );

    render(<IncomeExpensesDetailPage />);

    await screen.findByText(/Income expenses year chart/i);

    const latestCall = echartsPropsMock.mock.calls.at(-1)?.[0] as
      | { option?: { series?: Array<{ data?: Array<number | { value: number | null } | null> }> } }
      | undefined;

    expect(latestCall?.option?.series).toHaveLength(3);

    const incomeSeries = latestCall?.option?.series?.[0];
    const expensesSeries = latestCall?.option?.series?.[1];
    const savingsSeries = latestCall?.option?.series?.[2];

    expect(incomeSeries?.data?.[4]).toMatchObject({ value: 2500 });
    expect(expensesSeries?.data?.[4]).toMatchObject({ value: 1180 });
    expect(savingsSeries?.data?.[4]).toMatchObject({ value: 700 });
  });
});
