import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticatedAppShell } from "@/components/authenticated-app-shell";

const {
  replaceMock,
  getIdTokenMock,
  logoutMock,
  openQuickAddMock
} = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  getIdTokenMock: vi.fn(async () => "token"),
  logoutMock: vi.fn(),
  openQuickAddMock: vi.fn()
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    replace: replaceMock
  })
}));

vi.mock("@/components/quick-add-expense-panel", () => ({
  QuickAddExpensePanel: () => <div>Quick add form</div>
}));

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => ({
    getIdToken: getIdTokenMock,
    logout: logoutMock
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

vi.mock("@/features/app-shell/app-shell-provider", () => ({
  useAppShell: () => ({
    closeQuickAdd: vi.fn(),
    dismissQuickAddNotice: vi.fn(),
    isQuickAddOpen: false,
    quickAddNotice: null,
    openQuickAdd: openQuickAddMock,
    registerQuickAddResult: vi.fn()
  })
}));

describe("AuthenticatedAppShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza el header global y dispara las acciones principales", async () => {
    const user = userEvent.setup();

    render(
      <AuthenticatedAppShell
        description="Vista general"
        eyebrow="Resumen"
        title="Resumen"
      >
        <div>Contenido</div>
      </AuthenticatedAppShell>
    );

    expect(screen.getByRole("heading", { name: "Resumen" })).toBeInTheDocument();
    expect(screen.getByText(/Abril 2026/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Añadir gasto" }));
    expect(openQuickAddMock).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(replaceMock).toHaveBeenCalledWith("/login");
  });
});
