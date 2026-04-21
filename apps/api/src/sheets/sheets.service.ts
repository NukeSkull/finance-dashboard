import {
  BadGatewayException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { google, sheets_v4 } from "googleapis";

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

@Injectable()
export class SheetsService {
  private sheetsClient: sheets_v4.Sheets | null = null;

  constructor(private readonly configService: ConfigService) {}

  async readValues(
    range: string,
    options?: {
      valueRenderOption?: sheets_v4.Params$Resource$Spreadsheets$Values$Get["valueRenderOption"];
    }
  ) {
    const sheets = this.getSheetsClient();
    const spreadsheetId = this.getRequiredConfig("GOOGLE_SHEETS_SPREADSHEET_ID");

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
        valueRenderOption: options?.valueRenderOption ?? "UNFORMATTED_VALUE"
      });

      return response.data.values ?? [];
    } catch (error) {
      const status = getGoogleErrorStatus(error);

      if (status === 400 || status === 404) {
        throw new NotFoundException(`Google Sheets range not found: ${range}`);
      }

      throw new BadGatewayException("Google Sheets request failed.");
    }
  }

  async writeValue(range: string, value: string) {
    const sheets = this.getSheetsClient();
    const spreadsheetId = this.getRequiredConfig("GOOGLE_SHEETS_SPREADSHEET_ID");

    try {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[value]]
        }
      });
    } catch {
      throw new BadGatewayException("Google Sheets update failed.");
    }
  }

  private getSheetsClient() {
    if (this.sheetsClient) {
      return this.sheetsClient;
    }

    const clientEmail = this.getRequiredConfig("GOOGLE_SHEETS_CLIENT_EMAIL");
    const privateKey = normalizePrivateKey(
      this.getRequiredConfig("GOOGLE_SHEETS_PRIVATE_KEY")
    );

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: [SHEETS_SCOPE]
    });

    this.sheetsClient = google.sheets({ version: "v4", auth });
    return this.sheetsClient;
  }

  private getRequiredConfig(key: string) {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new ServiceUnavailableException(
        `Missing Google Sheets configuration: ${key}`
      );
    }

    return value;
  }
}

export function normalizePrivateKey(privateKey: string) {
  return privateKey
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n");
}

function getGoogleErrorStatus(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const maybeError = error as { code?: unknown; response?: { status?: unknown } };
  const code = maybeError.code;
  const responseStatus = maybeError.response?.status;

  if (typeof code === "number") {
    return code;
  }

  if (typeof responseStatus === "number") {
    return responseStatus;
  }

  return undefined;
}
