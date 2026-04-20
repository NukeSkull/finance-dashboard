import { Controller, Get, Query } from "@nestjs/common";
import { UseGuards } from "@nestjs/common";
import { FirebaseAuthGuard } from "../auth/firebase-auth.guard";
import { FinanceService } from "./finance.service";
import { parseMonth, parseYear } from "./monthly-summary.utils";

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
}
