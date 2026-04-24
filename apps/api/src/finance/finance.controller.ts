import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { FirebaseAuthGuard } from "../auth/firebase-auth.guard";
import { FinanceService } from "./finance.service";
import { parseMonth, parseYear } from "./monthly-summary.utils";
import {
  parseAssetOperationHistoryFilter,
  parseAssetOperationsFilter
} from "./asset-operations.utils";
import { parseQuickAddExpenseInput } from "./quick-add-expense.utils";

@Controller("finance")
@UseGuards(FirebaseAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get("monthly-summary")
  getMonthlySummary(@Query("year") year: string, @Query("month") month: string) {
    return this.financeService.getMonthlySummary({
      year: parseYear(year),
      month: parseMonth(month)
    });
  }

  @Get("income-expenses-detail")
  getIncomeExpensesDetail(
    @Query("year") year: string,
    @Query("month") month: string
  ) {
    return this.financeService.getIncomeExpensesDetail({
      year: parseYear(year),
      month: parseMonth(month)
    });
  }

  @Get("income-expenses-year-context")
  getIncomeExpensesYearContext(
    @Query("year") year: string,
    @Query("month") month: string
  ) {
    return this.financeService.getIncomeExpensesYearContext({
      year: parseYear(year),
      month: parseMonth(month)
    });
  }

  @Get("asset-purchases")
  getAssetPurchases(
    @Query("dateFrom") dateFrom: string | undefined,
    @Query("dateTo") dateTo: string | undefined
  ) {
    return this.financeService.getAssetPurchases(
      parseAssetOperationsFilter({ dateFrom, dateTo })
    );
  }

  @Get("asset-sales")
  getAssetSales(
    @Query("dateFrom") dateFrom: string | undefined,
    @Query("dateTo") dateTo: string | undefined
  ) {
    return this.financeService.getAssetSales(
      parseAssetOperationsFilter({ dateFrom, dateTo })
    );
  }

  @Get("asset-operations-history")
  getAssetOperationsHistory(
    @Query("type") type: string | undefined,
    @Query("q") q: string | undefined,
    @Query("product") product: string | undefined,
    @Query("platform") platform: string | undefined,
    @Query("currency") currency: string | undefined,
    @Query("dateFrom") dateFrom: string | undefined,
    @Query("dateTo") dateTo: string | undefined
  ) {
    return this.financeService.getAssetOperationsHistory(
      parseAssetOperationHistoryFilter({
        type,
        q,
        product,
        platform,
        currency,
        dateFrom,
        dateTo
      })
    );
  }

  @Get("zen-summary")
  getZenSummary() {
    return this.financeService.getZenSummary();
  }

  @Get("vt-markets/results")
  getVtMarketsResults(@Query("year") year: string | undefined) {
    return this.financeService.getVtMarketsResults({
      year: year ? parseYear(year) : undefined
    });
  }

  @Get("vt-markets/global-results")
  getVtMarketsGlobalResults() {
    return this.financeService.getVtMarketsGlobalResults();
  }

  @Get("vt-markets/account-totals")
  getVtMarketsAccountTotals() {
    return this.financeService.getVtMarketsAccountTotals();
  }

  @Get("net-worth-summary")
  getNetWorthSummary() {
    return this.financeService.getNetWorthSummary();
  }

  @Get("expense-categories")
  getExpenseCategories(@Query("year") year: string) {
    return this.financeService.getExpenseCategories({
      year: parseYear(year)
    });
  }

  @Post("quick-add-expense")
  quickAddExpense(@Body() body: unknown) {
    return this.financeService.quickAddExpense(parseQuickAddExpenseInput(body));
  }
}
