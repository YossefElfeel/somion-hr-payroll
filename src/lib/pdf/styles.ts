// Shared styles for all PDF documents so brand visuals stay consistent
// across payslips, evaluations, experience certificates, and HR letters.

import { StyleSheet } from "@react-pdf/renderer";

export const brand = {
  primary: "#7c3aed",        // violet-600 — matches tailwind brand
  primaryDark: "#5b21b6",
  text: "#0f172a",           // slate-900
  textMuted: "#475569",      // slate-600
  textFaint: "#94a3b8",      // slate-400
  divider: "#e2e8f0",        // slate-200
  bgFaint: "#f8fafc",        // slate-50
  positive: "#15803d",       // green-700
  negative: "#b91c1c",       // red-700
} as const;

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    color: brand.text,
    lineHeight: 1.5,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: brand.primary,
    paddingBottom: 12,
    marginBottom: 18,
  },
  brand: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: brand.primary,
    letterSpacing: 1,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    color: brand.textMuted,
    fontSize: 9.5,
  },
  h1: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  h2: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 18,
    marginBottom: 8,
    color: brand.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  paragraph: {
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: brand.divider,
  },
  label: { color: brand.textMuted },
  value: { color: brand.text },
  net: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: brand.text,
  },
  netLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  netValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: brand.primary,
  },
  footer: {
    marginTop: 28,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: brand.divider,
    color: brand.textFaint,
    fontSize: 8.5,
  },
  signatureBlock: {
    marginTop: 36,
  },
  signatureLine: {
    borderTopWidth: 0.5,
    borderTopColor: brand.text,
    paddingTop: 4,
    width: 200,
    color: brand.textMuted,
    fontSize: 9.5,
  },
  badge: {
    fontFamily: "Helvetica-Bold",
    color: brand.primary,
  },
});

export function formatCHF(n: number): string {
  return `${n.toLocaleString("en-CH", { maximumFractionDigits: 0 })} CHF`;
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
