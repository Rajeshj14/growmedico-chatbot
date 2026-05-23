import type { Metadata } from "next";
import type { ReactNode } from "react";

import "../styles.css";

export const metadata: Metadata = {
  title: "Grow Medico - Consultation",
  description:
    "Private consultation with Grow Medico for personal branding, digital marketing, and growth.",
  openGraph: {
    title: "Grow Medico - Consultation",
    description: "Personal branding, digital marketing, and growth strategy for professionals.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
