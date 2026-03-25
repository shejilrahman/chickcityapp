import { Amiri, Cinzel } from "next/font/google";
import { CartProvider } from "@/components/CartContext";
import AppShell from "@/components/AppShell";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-cinzel",
});
const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
});

export const viewport = {
  themeColor: "#0f1b5c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  title: "Noor al Mandi",
  description: "Order hot & fresh food via WhatsApp",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Noor al Mandi",
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
      <body className={`${cinzel.variable} ${amiri.variable} font-sans antialiased bg-slate-100 text-slate-900`}>
        <CartProvider>
          <AppShell>
            {children}
          </AppShell>
        </CartProvider>
      </body>
    </html>
  );
}
