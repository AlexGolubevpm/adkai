import { google, sheets_v4 } from "googleapis";

export interface SheetRow {
  rowIndex: number;
  site: string;
  cost: number;
  date: string;
  users?: number;
}

export interface SheetParseResult {
  rows: SheetRow[];
  errors: { row: number; reason: string }[];
}

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !key) {
    throw new Error("Google Service Account credentials not configured");
  }

  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

function getSheetsClient(): sheets_v4.Sheets {
  return google.sheets({ version: "v4", auth: getAuth() });
}

/** Fetch all sheet names from a spreadsheet */
export async function getSpreadsheetInfo(spreadsheetId: string) {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.get({ spreadsheetId });

  return {
    title: res.data.properties?.title ?? "",
    sheets:
      res.data.sheets?.map((s) => ({
        title: s.properties?.title ?? "",
        index: s.properties?.index ?? 0,
      })) ?? [],
  };
}

/** Preview first N rows from a sheet */
export async function previewSheet(
  spreadsheetId: string,
  sheetName: string,
  maxRows = 5
) {
  const sheets = getSheetsClient();
  const range = `'${sheetName}'!A1:Z${maxRows + 1}`;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return res.data.values ?? [];
}

/** Column letter to 0-based index (A=0, B=1, ..., Z=25, AA=26, ...) */
function colToIndex(col: string): number {
  let idx = 0;
  for (let i = 0; i < col.length; i++) {
    idx = idx * 26 + (col.charCodeAt(i) - 64);
  }
  return idx - 1;
}

/** Parse a date string from Google Sheets into YYYY-MM-DD format */
function parseDate(raw: string): string | null {
  if (!raw) return null;

  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // Try DD.MM.YYYY or DD/MM/YYYY
  const euMatch = raw.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (euMatch) {
    const [, d, m, y] = euMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Try MM/DD/YYYY
  const usMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const [, m, d, y] = usMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Try Google Sheets serial number (days since 1899-12-30)
  const serial = Number(raw);
  if (!isNaN(serial) && serial > 40000 && serial < 60000) {
    const date = new Date(Date.UTC(1899, 11, 30 + serial));
    return date.toISOString().split("T")[0];
  }

  // Try native Date parse
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];

  return null;
}

/** Read and parse cost data from Google Sheets */
export async function readCostData(config: {
  spreadsheetId: string;
  sheetName: string;
  siteColumn: string;
  costColumn: string;
  dateColumn: string;
  usersColumn?: string | null;
  dataStartRow: number;
}): Promise<SheetParseResult> {
  const sheets = getSheetsClient();

  // Build column range from all used columns
  const cols = [config.siteColumn, config.costColumn, config.dateColumn];
  if (config.usersColumn) cols.push(config.usersColumn);
  const minCol = cols.sort()[0];
  const maxCol = cols.sort()[cols.length - 1];

  const range = `'${config.sheetName}'!${minCol}${config.dataStartRow}:${maxCol}10000`;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range,
  });

  const values = res.data.values ?? [];
  const rows: SheetRow[] = [];
  const errors: { row: number; reason: string }[] = [];

  const siteIdx = colToIndex(config.siteColumn) - colToIndex(minCol);
  const costIdx = colToIndex(config.costColumn) - colToIndex(minCol);
  const dateIdx = colToIndex(config.dateColumn) - colToIndex(minCol);
  const usersIdx = config.usersColumn
    ? colToIndex(config.usersColumn) - colToIndex(minCol)
    : -1;

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const rowNum = config.dataStartRow + i;
    const rawSite = String(row[siteIdx] ?? "").trim();
    const rawCost = String(row[costIdx] ?? "").trim();
    const rawDate = String(row[dateIdx] ?? "").trim();

    if (!rawSite && !rawCost && !rawDate) continue; // skip empty rows

    if (!rawSite) {
      errors.push({ row: rowNum, reason: "Empty site name" });
      continue;
    }

    const cost = Number(rawCost.replace(/[,$\s]/g, ""));
    if (isNaN(cost)) {
      errors.push({ row: rowNum, reason: `Invalid cost value: "${rawCost}"` });
      continue;
    }

    const date = parseDate(rawDate);
    if (!date) {
      errors.push({ row: rowNum, reason: `Invalid date format: "${rawDate}"` });
      continue;
    }

    const entry: SheetRow = { rowIndex: rowNum, site: rawSite, cost, date };

    if (usersIdx >= 0 && row[usersIdx] !== undefined) {
      const users = Number(String(row[usersIdx]).replace(/[,\s]/g, ""));
      if (!isNaN(users)) entry.users = users;
    }

    rows.push(entry);
  }

  return { rows, errors };
}
