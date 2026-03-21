import { Inter, Manjari } from "next/font/google";
import { CartProvider } from "@/components/CartContext";
import AppShell from "@/components/AppShell";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manjari = Manjari({
  weight: ["100", "400", "700"],
  subsets: ["malayalam"],
  variable: "--font-manjari",
});

export const viewport = {
  themeColor: "#065f46",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  title: "Chick City Restaurant App",
  description: "Order hot & fresh food via WhatsApp",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chick City",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${inter.variable} ${manjari.variable} font-sans antialiased bg-slate-100 text-slate-900`}>
        <CartProvider>
          <AppShell>
            {children}
          </AppShell>
        </CartProvider>
      </body>
    </html>
  );
}
