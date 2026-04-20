import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getRoot() {
    return {
      name: "finance-dashboard-api",
      status: "ok"
    };
  }
}
