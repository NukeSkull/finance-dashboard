import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuickAddExpensePanel } from "@/components/quick-add-expense-panel";
import { createQuickAddExpenseResult } from "@/test/factories";

const { fetchExpenseCategoriesMock, createQuickAddExpenseMock } = vi.hoisted(() => ({
  fetchExpenseCategoriesMock: vi.fn(),
  createQuickAddExpenseMock: vi.fn()
}));

vi.mock("@/lib/api/client", () => ({
  createQuickAddExpense: createQuickAddExpenseMock,
  fetchExpenseCategories: fetchExpenseCategoriesMock
}));

describe("QuickAddExpensePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    fetchExpenseCategoriesMock.mockResolvedValue([
      { id: "rent", label: "Alquiler" },
      { id: "food", label: "Comida" }
    ]);
    createQuickAddExpenseMock.mockResolvedValue(createQuickAddExpenseResult());
  });

  it("guarda un gasto y muestra el ultimo movimiento y categorias recientes", async () => {
    const onExpenseAdded = vi.fn();
    const user = userEvent.setup();

    render(
      <QuickAddExpensePanel getIdToken={async () => "token"} onExpenseAdded={onExpenseAdded} />
    );

    await user.click(screen.getByRole("button", { name: "Abrir formulario" }));
    await screen.findByRole("option", { name: "Alquiler" });

    await user.selectOptions(screen.getByLabelText("Categoria"), "rent");
    await user.type(screen.getByLabelText("Importe"), "50");
    await user.click(screen.getByRole("button", { name: "Guardar gasto" }));

    await screen.findByText(/Gasto guardado en Alquiler/i);

    expect(createQuickAddExpenseMock).toHaveBeenCalledWith({
      expense: {
        amount: 50,
        categoryId: "rent",
        currency: "EUR",
        month: expect.any(Number),
        year: expect.any(Number)
      },
      token: "token"
    });
    expect(onExpenseAdded).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/Ultimo movimiento/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Alquiler" })).toBeInTheDocument();
  });

  it("permite repetir el ultimo movimiento guardado", async () => {
    window.localStorage.setItem(
      "finance-dashboard.quick-add-history.v1",
      JSON.stringify({
        lastExpense: {
          amount: 22,
          categoryId: "food",
          categoryLabel: "Comida",
          currency: "EUR",
          month: 3,
          year: 2026
        },
        recentCategoryIds: ["food"]
      })
    );

    const user = userEvent.setup();

    render(
      <QuickAddExpensePanel getIdToken={async () => "token"} onExpenseAdded={vi.fn()} />
    );

    await user.click(screen.getByRole("button", { name: /Repetir ultimo/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Ocultar" })).toBeInTheDocument()
    );

    expect(screen.getByDisplayValue("22")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Comida" })).toBeInTheDocument();
  });
});
