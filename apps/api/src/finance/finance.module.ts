import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { SheetsModule } from "../sheets/sheets.module";
import { FinanceController } from "./finance.controller";
import { FinanceService } from "./finance.service";

@Module({
  imports: [AuthModule, SheetsModule],
  controllers: [FinanceController],
  providers: [FinanceService]
})
export class FinanceModule {}
