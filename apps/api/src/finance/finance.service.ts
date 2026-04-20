import { Injectable, NotFoundException } from "@nestjs/common";
import { SheetsService } from "../sheets/sheets.service";
import {
  buildIncomeExpensesRange,
  buildMonthlySummary
} from "./monthly-summary.utils";

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
}
