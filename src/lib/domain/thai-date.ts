/**
 * Pure functions for normalizing Thai Buddhist Era (พ.ศ.) dates to ISO YYYY-MM-DD (ค.ศ.)
 * and formatting ISO dates back to Thai BE DD/MM/YYYY for UI presentation.
 */

export function normalizeThaiDateToIso(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/\s+/g, "");
  if (!cleaned || cleaned === "-" || /^\/+$/.test(cleaned)) {
    return null;
  }

  // Case 1: Already ISO format YYYY-MM-DD
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(cleaned);
  if (isoMatch) {
    let year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (year >= 2400) {
      year -= 543;
    }
    return formatIsoParts(year, month, day);
  }

  // Case 2: DD/MM/YYYY or DD/MM/YY (or DD-MM-YYYY)
  const dmyMatch = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/.exec(cleaned);
  if (!dmyMatch) {
    return null;
  }

  const day = Number(dmyMatch[1]);
  const month = Number(dmyMatch[2]);
  let year = Number(dmyMatch[3]);

  if (year < 100) {
    // 2-digit year from Thai stamp e.g. "69" -> 2569 -> 2026
    const buddhistYear = year >= 50 ? 2500 + year : 2600 + year;
    year = buddhistYear - 543;
  } else if (year >= 2400) {
    // 4-digit Buddhist Era year e.g. 2569 -> 2026
    year -= 543;
  }

  return formatIsoParts(year, month, day);
}

function formatIsoParts(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2200) {
    return null;
  }
  const yyyy = String(year).padStart(4, "0");
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatIsoToThaiDate(isoDate: string | Date | null | undefined): string {
  if (!isoDate) return "";
  const isoStr =
    isoDate instanceof Date ? isoDate.toISOString().slice(0, 10) : isoDate.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoStr);
  if (!match) return isoStr;

  const ceYear = Number(match[1]);
  const beYear = ceYear < 2400 ? ceYear + 543 : ceYear;
  return `${match[3]}/${match[2]}/${beYear}`;
}
