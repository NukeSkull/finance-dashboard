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
  buildIncomeExpensesYearContext,
  buildIncomeExpensesYearContextRange
} from "./income-expenses-year-context.utils";
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
import {
  buildNetWorthSummary,
  buildNetWorthSummaryRange
} from "./net-worth-summary.utils";
import {
  buildVtMarketsAccountTotals,
  buildVtMarketsAccountTotalsRange,
  buildVtMarketsGlobalResults,
  buildVtMarketsGlobalResultsRange,
  buildVtMarketsResults,
  buildVtMarketsResultsRange,
  discoverVtMarketsYears,
  resolveVtMarketsResultsYear
} from "./vt-markets.utils";
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

  async getIncomeExpensesYearContext(input: { year: number; month: number }) {
    const values = await this.sheetsService.readValues(
      buildIncomeExpensesYearContextRange(input.year)
    );

    if (values.length === 0) {
      throw new NotFoundException(
        `No values found for year ${input.year} in income/expenses year context.`
      );
    }

    return buildIncomeExpensesYearContext({
      year: input.year,
      selectedMonth: input.month,
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

  async getVtMarketsResults(input: { year?: number }) {
    const titles = await this.sheetsService.listSheetTitles();
    const availableYears = discoverVtMarketsYears(titles);
    const year = resolveVtMarketsResultsYear(input.year, availableYears);
    const values = await this.sheetsService.readValues(buildVtMarketsResultsRange(year));

    if (values.length === 0) {
      throw new NotFoundException(`No values found for VT Markets ${year}.`);
    }

    return buildVtMarketsResults({
      year,
      availableYears,
      values
    });
  }

  async getVtMarketsGlobalResults() {
    const values = await this.sheetsService.readValues(
      buildVtMarketsGlobalResultsRange()
    );

    if (values.length === 0) {
      throw new NotFoundException("No VT Markets global results were found.");
    }

    return buildVtMarketsGlobalResults(values);
  }

  async getVtMarketsAccountTotals() {
    const values = await this.sheetsService.readValues(
      buildVtMarketsAccountTotalsRange()
    );

    if (values.length === 0) {
      throw new NotFoundException("No VT Markets account totals were found.");
    }

    return buildVtMarketsAccountTotals(values);
  }

  async getNetWorthSummary() {
    const values = await this.sheetsService.readValues(buildNetWorthSummaryRange());

    if (values.length === 0) {
      throw new NotFoundException("No net worth values were found.");
    }

    return buildNetWorthSummary(values);
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
