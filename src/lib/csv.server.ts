const BOM = "﻿";

function escapeCSVField(value: unknown): string {
  const str = value == null ? "" : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCSVResponse(
  rows: Record<string, unknown>[],
  filename: string,
): Response {
  if (rows.length === 0) {
    return new Response(BOM, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const headers = Object.keys(rows[0]);
  const headerLine = headers.map(escapeCSVField).join(",");
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCSVField(row[h])).join(","),
  );
  const csv = BOM + [headerLine, ...dataLines].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
