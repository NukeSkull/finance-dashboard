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
      throw mapGoogleSheetsError(error, {
        accessDeniedMessage: "Google Sheets read access failed.",
        defaultMessage: "Google Sheets request failed.",
        notFoundMessage: `Google Sheets range not found: ${range}`
      });
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
    } catch (error) {
      throw mapGoogleSheetsError(error, {
        accessDeniedMessage: "Google Sheets write access failed.",
        defaultMessage: "Google Sheets update failed.",
        notFoundMessage: `Google Sheets range not found: ${range}`
      });
    }
  }

  async listSheetTitles() {
    const sheets = this.getSheetsClient();
    const spreadsheetId = this.getRequiredConfig("GOOGLE_SHEETS_SPREADSHEET_ID");

    try {
      const response = await sheets.spreadsheets.get({
        spreadsheetId,
        includeGridData: false
      });

      return (response.data.sheets ?? [])
        .map((sheet) => sheet.properties?.title)
        .filter((title): title is string => Boolean(title));
    } catch (error) {
      throw mapGoogleSheetsError(error, {
        accessDeniedMessage: "Google Sheets metadata access failed.",
        defaultMessage: "Google Sheets metadata request failed.",
        notFoundMessage: "Google Sheets spreadsheet metadata not found."
      });
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

function mapGoogleSheetsError(
  error: unknown,
  messages: {
    notFoundMessage: string;
    accessDeniedMessage: string;
    defaultMessage: string;
  }
) {
  const status = getGoogleErrorStatus(error);

  if (status === 400 || status === 404) {
    return new NotFoundException(messages.notFoundMessage);
  }

  if (status === 401 || status === 403) {
    return new BadGatewayException(messages.accessDeniedMessage);
  }

  return new BadGatewayException(messages.defaultMessage);
}
