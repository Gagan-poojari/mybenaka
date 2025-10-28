import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthContext from "./contexts/AuthContext";
import UserContext from "./contexts/UserContext";
import ClientProviders from "./ClientProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://mybenaka.com"), // change if hosted elsewhere
  title: {
    default: "MyBenaka - Simplify Your Finances",
    template: "%s | MyBenaka",
  },
  description:
    "MyBenaka is a smart, secure finance platform that organizations use to track loans, manage payments, and achieve financial clarity. Experience a new era of effortless money management.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
