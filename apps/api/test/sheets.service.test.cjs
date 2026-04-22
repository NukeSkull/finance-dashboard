const assert = require("node:assert/strict");
const test = require("node:test");
const {
  BadGatewayException,
  NotFoundException,
  ServiceUnavailableException
} = require("@nestjs/common");

const { SheetsService, normalizePrivateKey } = require("../dist/sheets/sheets.service");

test("normalizes private keys stored on one line", () => {
  assert.equal(
    normalizePrivateKey('"line-1\\nline-2"'),
    "line-1\nline-2"
  );
});

test("fails with service unavailable when configuration is missing", async () => {
  const service = new SheetsService({
    get() {
      return undefined;
    }
  });

  await assert.rejects(
    () => service.readValues("'Ingresos/Gastos 2026'!E4:E45"),
    (error) => {
      assert.ok(error instanceof ServiceUnavailableException);
      assert.match(error.message, /GOOGLE_SHEETS_CLIENT_EMAIL|GOOGLE_SHEETS_SPREADSHEET_ID/);
      return true;
    }
  );
});

test("maps Google read 404 into not found", async () => {
  const service = createConfiguredService({
    async get() {
      throw { response: { status: 404 } };
    }
  });

  await assert.rejects(
    () => service.readValues("'Ingresos/Gastos 2026'!E4:E45"),
    (error) => {
      assert.ok(error instanceof NotFoundException);
      assert.equal(
        error.message,
        "Google Sheets range not found: 'Ingresos/Gastos 2026'!E4:E45"
      );
      return true;
    }
  );
});

test("maps Google write 403 into bad gateway with access-specific message", async () => {
  const service = createConfiguredService({
    async update() {
      throw { code: 403 };
    }
  });

  await assert.rejects(
    () => service.writeValue("'Ingresos/Gastos 2026'!E6", "=42"),
    (error) => {
      assert.ok(error instanceof BadGatewayException);
      assert.equal(error.message, "Google Sheets write access failed.");
      return true;
    }
  );
});

test("maps generic metadata failures into bad gateway", async () => {
  const service = createConfiguredService({
    async getMetadata() {
      throw new Error("boom");
    }
  });

  await assert.rejects(
    () => service.listSheetTitles(),
    (error) => {
      assert.ok(error instanceof BadGatewayException);
      assert.equal(error.message, "Google Sheets metadata request failed.");
      return true;
    }
  );
});

test("returns sheet titles when metadata request succeeds", async () => {
  const service = createConfiguredService({
    async getMetadata() {
      return {
        data: {
          sheets: [
            { properties: { title: "Compras" } },
            { properties: { title: "Ventas" } },
            { properties: {} }
          ]
        }
      };
    }
  });

  const titles = await service.listSheetTitles();

  assert.deepEqual(titles, ["Compras", "Ventas"]);
});

function createConfiguredService(overrides) {
  const config = {
    GOOGLE_SHEETS_SPREADSHEET_ID: "sheet-id",
    GOOGLE_SHEETS_CLIENT_EMAIL: "service@example.com",
    GOOGLE_SHEETS_PRIVATE_KEY: "line-1\\nline-2"
  };
  const service = new SheetsService({
    get(key) {
      return config[key];
    }
  });

  service.sheetsClient = {
    spreadsheets: {
      values: {
        get: overrides.get ?? (async () => ({ data: { values: [[1]] } })),
        update: overrides.update ?? (async () => undefined)
      },
      get:
        overrides.getMetadata ??
        (async () => ({
          data: {
            sheets: []
          }
        }))
    }
  };

  return service;
}
