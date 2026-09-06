"use server";

import ExcelJS from "exceljs";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { requireUser } from "@/lib/auth";
import { validateTitle } from "@/lib/validation";
import type { ActiveTimerDoc, PomodoroSessionDoc } from "@/lib/types";

const COLUMNS = [
  { header: "Title", key: "title", width: 40 },
  { header: "Start Time", key: "start", width: 24 },
  { header: "End Time", key: "end", width: 24 },
  { header: "Duration (minutes)", key: "duration", width: 18 },
];

const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_IMPORT_ROWS = 1000;
const MAX_IMPORTED_SESSION_SECONDS = 24 * 60 * 60; // sanity cap per row

export interface ExportResult {
  filename: string;
  base64: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export async function exportSessionsAction(): Promise<ExportResult> {
  const user = await requireUser();
  const db = await getDb();
  const uid = new ObjectId(user.id);

  const sessions = await db
    .collection<PomodoroSessionDoc>("pomodoroSessions")
    .find({ userId: uid }, { projection: { title: 1, startTime: 1, endTime: 1, duration: 1 } })
    .sort({ startTime: 1 })
    .toArray();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sessions");
  sheet.columns = COLUMNS;

  for (const s of sessions) {
    sheet.addRow({
      title: s.title,
      start: s.startTime.toISOString(),
      end: s.endTime.toISOString(),
      duration: Math.round(s.duration / 60),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);

  return {
    filename: `pomodoro-sessions-${date}.xlsx`,
    base64: Buffer.from(buffer).toString("base64"),
  };
}

function findColumnIndex(headerRow: ExcelJS.Row, name: string): number | null {
  let found: number | null = null;
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    if (String(cell.value ?? "").trim().toLowerCase() === name.toLowerCase()) {
      found = colNumber;
    }
  });
  return found;
}

function cellToDate(value: ExcelJS.CellValue): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function cellToString(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "object" && "text" in value) return String(value.text ?? "");
  return String(value);
}

export async function importSessionsAction(formData: FormData): Promise<ImportResult> {
  const user = await requireUser();
  const uid = new ObjectId(user.id);

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("No file was provided.");
  }
  if (file.size === 0) {
    throw new Error("The selected file is empty.");
  }
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    throw new Error("File is too large (max 5MB).");
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(arrayBuffer);
  } catch {
    throw new Error("Could not read that file as an Excel (.xlsx) workbook.");
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error("The workbook has no worksheets.");
  }

  const headerRow = sheet.getRow(1);
  const titleCol = findColumnIndex(headerRow, "Title");
  const startCol = findColumnIndex(headerRow, "Start Time");
  const endCol = findColumnIndex(headerRow, "End Time");

  if (!titleCol || !startCol || !endCol) {
    throw new Error('Expected columns "Title", "Start Time", and "End Time" were not found.');
  }

  const docs: PomodoroSessionDoc[] = [];
  const errors: string[] = [];
  let skipped = 0;

  const lastRow = Math.min(sheet.rowCount, MAX_IMPORT_ROWS + 1);
  if (sheet.rowCount > MAX_IMPORT_ROWS + 1) {
    errors.push(`Only the first ${MAX_IMPORT_ROWS} rows were processed.`);
  }

  for (let rowNumber = 2; rowNumber <= lastRow; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    if (row.actualCellCount === 0) continue;

    const title = cellToString(row.getCell(titleCol).value).trim();
    const startTime = cellToDate(row.getCell(startCol).value);
    const endTime = cellToDate(row.getCell(endCol).value);

    const titleError = title ? validateTitle(title) : "Title is required.";
    if (titleError) {
      skipped++;
      if (errors.length < 10) errors.push(`Row ${rowNumber}: ${titleError}`);
      continue;
    }
    if (!startTime || !endTime) {
      skipped++;
      if (errors.length < 10) errors.push(`Row ${rowNumber}: invalid start/end time.`);
      continue;
    }
    const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
    if (durationSeconds <= 0 || durationSeconds > MAX_IMPORTED_SESSION_SECONDS) {
      skipped++;
      if (errors.length < 10) errors.push(`Row ${rowNumber}: duration out of range.`);
      continue;
    }

    docs.push({
      _id: new ObjectId(),
      userId: uid,
      title,
      startTime,
      endTime,
      duration: durationSeconds,
      createdAt: new Date(),
    });
  }

  if (docs.length > 0) {
    const db = await getDb();
    await db.collection<PomodoroSessionDoc>("pomodoroSessions").insertMany(docs);
  }

  return { imported: docs.length, skipped, errors };
}

/** Permanently deletes all of the current user's sessions and any in-progress timer. */
export async function clearAllDataAction(): Promise<void> {
  const user = await requireUser();
  const uid = new ObjectId(user.id);
  const db = await getDb();

  await Promise.all([
    db.collection<PomodoroSessionDoc>("pomodoroSessions").deleteMany({ userId: uid }),
    db.collection<ActiveTimerDoc>("activeTimers").deleteOne({ _id: uid }),
  ]);
}
