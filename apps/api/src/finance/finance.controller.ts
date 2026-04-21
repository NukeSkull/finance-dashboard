import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { FirebaseAuthGuard } from "../auth/firebase-auth.guard";
import { FinanceService } from "./finance.service";
import { parseMonth, parseYear } from "./monthly-summary.utils";
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
