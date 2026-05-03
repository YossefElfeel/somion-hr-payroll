import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Somion HR — Payroll",
  description: "Payroll workflow with freeze, approval, and payment lifecycle",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
