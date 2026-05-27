import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AWS D1.1 Rating Calculator | Ultrasonic Testing",
  description: "Calculate AWS D1.1 Ultrasonic Testing (UT) ratings. Multi-leg evaluation, flaw depth, and acceptance criteria based on AWS D1.1 Table 8.2.",
  keywords: ["AWS D1.1", "Rating Calculator", "Ultrasonic Testing", "UT Calculator", "NDT", "NDI", "Weld Inspection"],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
