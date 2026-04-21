import { Injectable, NotFoundException } from "@nestjs/common";
import { SheetsService } from "../sheets/sheets.service";
import {
  AssetOperationsFilter,
  buildAssetOperationsRange,
  buildAssetOperationsResponse
} from "./asset-operations.utils";
import {
  buildIncomeExpensesDetail,
  buildIncomeExpensesDetailRange
} from "./income-expenses-detail.utils";
import {
  buildIncomeExpensesRange,
  buildMonthlySummary
} from "./monthly-summary.utils";
import {
  buildExpenseCellRange,
  buildExpenseCategories,
  buildExpenseCategoriesRange,
  planExpenseCellUpdate,
  QuickAddExpenseInput,
  resolveExpenseCategoryById
} from "./quick-add-expense.utils";
import { buildZenSummary, buildZenSummaryRange } from "./zen-summary.utils";

@Injectable()
export class FinanceService {
  constructor(private readonly sheetsService: SheetsService) {}

  async getMonthlySummary(input: { year: number; month: number }) {
    const range = buildIncomeExpensesRange(input.year, input.month);
    const values = await this.sheetsService.readValues(range);

    if (values.length === 0) {
      throw new NotFoundException(`No values found for range: ${range}`);
    }

    return buildMonthlySummary({
      year: input.year,
      month: input.month,
      values
    });
  }

  async getIncomeExpensesDetail(input: { year: number; month: number }) {
    const values = await this.sheetsService.readValues(
      buildIncomeExpensesDetailRange(input.year)
    );

    if (values.length === 0) {
      throw new NotFoundException(
        `No values found for year ${input.year} in income/expenses detail.`
      );
    }

    return buildIncomeExpensesDetail({
      year: input.year,
      month: input.month,
      values
    });
  }

  async getAssetPurchases(filter: AssetOperationsFilter) {
    return this.getAssetOperations("purchase", filter);
  }

  async getAssetSales(filter: AssetOperationsFilter) {
    return this.getAssetOperations("sale", filter);
  }

  async getZenSummary() {
    const values = await this.sheetsService.readValues(buildZenSummaryRange());

    if (values.length === 0) {
      throw new NotFoundException("No values found for Zen sheet.");
    }

    return buildZenSummary(values);
  }

  async getExpenseCategories(input: { year: number }) {
    const categories = await this.loadExpenseCategories(input.year);

    return categories.map(({ id, label }) => ({
      id,
      label
    }));
  }

  async quickAddExpense(input: QuickAddExpenseInput) {
    const categories = await this.loadExpenseCategories(input.year);
    const category = resolveExpenseCategoryById(categories, input.categoryId);

    if (!category) {
      throw new NotFoundException("Expense category not found.");
    }

    const cell = buildExpenseCellRange({
      year: input.year,
      month: input.month,
      row: category.row
    });
    const [[existingValue] = []] = await this.sheetsService.readValues(cell, {
      valueRenderOption: "FORMULA"
    });
    const updatePlan = planExpenseCellUpdate({
      amount: input.amount,
      existingValue
    });

    await this.sheetsService.writeValue(cell, updatePlan.nextValue);

    return {
      success: true,
      categoryId: category.id,
      categoryLabel: category.label,
      year: input.year,
      month: input.month,
      currency: input.currency,
      cell,
      writtenValue: updatePlan.nextValue
    };
  }

  private async loadExpenseCategories(year: number) {
    const values = await this.sheetsService.readValues(
      buildExpenseCategoriesRange(year)
    );

    return buildExpenseCategories(values);
  }

  private async getAssetOperations(
    kind: "purchase" | "sale",
    filter: AssetOperationsFilter
  ) {
    const values = await this.sheetsService.readValues(buildAssetOperationsRange(kind));

    if (values.length === 0) {
      throw new NotFoundException(`No values found for ${kind} sheet.`);
    }

    return buildAssetOperationsResponse({
      kind,
      filter,
      values
    });
  }
}
