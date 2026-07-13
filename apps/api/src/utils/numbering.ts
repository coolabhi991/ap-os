// Shared helpers for the Document Numbering Standard (Client/Project/Site/Vendor/Employee/
// Partner/Liability master codes and their child-document numbering). Financial Year is Indian
// convention: April 1 - March 31.

export function getFinancialYear(date: Date): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1; // 1-12
  const startYear = month >= 4 ? year : year - 1;
  const endYear = (startYear + 1) % 100;
  return `${String(startYear % 100).padStart(2, "0")}-${String(endYear).padStart(2, "0")}`;
}

export function getTalukaCode(taluka: string): string {
  const letters = taluka.trim().replace(/[^a-zA-Z]/g, "");
  return letters.slice(0, 3).toUpperCase() || "GEN";
}

// "Jal Jeevan Mission" -> "JJM". Falls back to the first 3 letters of a single-word name.
export function deriveInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "GEN";
  if (words.length === 1) return words[0].replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "GEN";
  return words
    .map((w) => w.replace(/[^a-zA-Z]/g, "").charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 6);
}

export function padSeq(n: number, width = 3): string {
  return String(n).padStart(width, "0");
}
