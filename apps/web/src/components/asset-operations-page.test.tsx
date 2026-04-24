import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssetOperationsPage } from "@/components/asset-operations-page";
import { createAssetOperationsHistoryResponse } from "@/test/factories";

const {
  replaceMock,
  getIdTokenMock,
  userMock,
  fetchAssetOperationsHistoryMock
} = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  getIdTokenMock: vi.fn(async () => "token"),
  userMock: { email: "test@example.com" },
  fetchAssetOperationsHistoryMock: vi.fn()
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/asset-operations",
  useRouter: () => ({
    replace: replaceMock
  }),
  useSearchParams: () => new URLSearchParams()
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
  fetchAssetOperationsHistory: fetchAssetOperationsHistoryMock
}));

describe("AssetOperationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAssetOperationsHistoryMock.mockResolvedValue(createAssetOperationsHistoryResponse());
  });

  it("renderiza la vista unificada con KPIs, helper y tabla central", async () => {
    render(<AssetOperationsPage />);

    expect(await screen.findByRole("heading", { name: /movimientos registrados/i })).toBeInTheDocument();
    expect(screen.getByText(/Mostrando 2 de 2 operaciones/i)).toBeInTheDocument();

    const kpiRegion = screen.getByLabelText(/KPIs de operaciones/i);
    expect(within(kpiRegion).getByText(/^Operaciones$/i)).toBeInTheDocument();
    expect(within(kpiRegion).getByText(/^Compras totales$/i)).toBeInTheDocument();
    expect(within(kpiRegion).getByText(/^Ventas totales$/i)).toBeInTheDocument();
    expect(within(kpiRegion).getByText(/^Balance neto$/i)).toBeInTheDocument();
    expect(within(kpiRegion).getByText(/^Activos operados$/i)).toBeInTheDocument();
    expect(within(kpiRegion).getByText(/^Ticket medio$/i)).toBeInTheDocument();

    expect(screen.getByRole("table", { name: /historial de operaciones/i })).toBeInTheDocument();
    expect(screen.getByText(/^Compra$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Venta$/i)).toBeInTheDocument();
  });

  it("persist e tabs y reset en la URL", async () => {
    const user = userEvent.setup();

    render(<AssetOperationsPage />);

    await screen.findByText(/Mostrando 2 de 2 operaciones/i);

    await user.click(screen.getByRole("button", { name: /^Ventas$/i }));
    expect(replaceMock).toHaveBeenCalledWith("/asset-operations?type=sales");

    await user.click(screen.getByRole("button", { name: /resetear filtros/i }));
    expect(replaceMock).toHaveBeenCalledWith("/asset-operations");
  });

  it("carga el historial unificado con la vista all por defecto", async () => {
    render(<AssetOperationsPage />);

    await waitFor(() => {
      expect(fetchAssetOperationsHistoryMock).toHaveBeenCalled();
    });

    expect(fetchAssetOperationsHistoryMock).toHaveBeenLastCalledWith({
      currency: null,
      dateFrom: null,
      dateTo: null,
      platform: null,
      product: null,
      q: null,
      token: "token",
      type: "all"
    });
  });

  it("muestra operaciones de forma progresiva y permite cargar mas", async () => {
    const user = userEvent.setup();
    const items = Array.from({ length: 30 }, (_, index) => ({
      date: "15/04/2026",
      dateSerial: 46027 - index,
      feesEur: null,
      feesUsd: null,
      operationType: index % 2 === 0 ? ("purchase" as const) : ("sale" as const),
      platform: "Trade Republic",
      product: `Activo ${index + 1}`,
      quantity: index + 1,
      totalEur: 100 + index,
      totalUsd: null,
      unitPriceEur: 100 + index,
      unitPriceUsd: null
    }));

    fetchAssetOperationsHistoryMock.mockResolvedValue(
      createAssetOperationsHistoryResponse({
        items,
        summary: {
          averageTicketEur: 114.5,
          netBalanceEur: -75,
          operatedAssetsCount: 30,
          operationsCount: 30,
          purchasesTotalEur: 1500,
          salesTotalEur: 1425
        }
      })
    );

    render(<AssetOperationsPage />);

    expect(await screen.findByText(/Mostrando 25 de 30 operaciones/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cargar mas/i })).toBeInTheDocument();
    expect(screen.queryByText("Activo 26")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cargar mas/i }));

    expect(await screen.findByText(/Mostrando 30 de 30 operaciones/i)).toBeInTheDocument();
    expect(screen.getByText("Activo 26")).toBeInTheDocument();
  });
});
