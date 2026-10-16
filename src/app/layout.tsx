import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GPO Delivery Note OCR & Database System",
  description:
    "ระบบอ่านข้อมูลใบส่งขององค์การเภสัชกรรม (GPO) 3 ระดับ พร้อมตรวจสอบสมการอัตโนมัติและนำเข้าฐานข้อมูล PostgreSQL",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
