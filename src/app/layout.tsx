import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#904d00",
  colorScheme: "light",
};

export const metadata: Metadata = {
  title: "PawsFound - Encuentra Mascotas Perdidas",
  description:
    "Red comunitaria de ayuda mutua para mascotas perdidas y avistadas. Conecta a dueños y personas cercanas en tiempo real.",
  keywords: [
    "mascotas",
    "perdidas",
    "encontrar",
    "perros",
    "gatos",
    "comunidad",
    "ayuda",
  ],
  authors: [{ name: "PawsFound Team" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PawsFound",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-512.png" }],
  },
  openGraph: {
    title: "PawsFound - Encuentra Mascotas Perdidas",
    description:
      "Red comunitaria de ayuda mutua para mascotas perdidas y avistadas.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-512.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${plusJakarta.variable} ${beVietnam.variable} antialiased`}
      >
        {children}
        <Toaster />
        <PwaRegister />
      </body>
    </html>
  );
}

function PwaRegister() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
          }
          // Request notification permission
          if ('Notification' in window && Notification.permission === 'default') {
            setTimeout(() => {
              Notification.requestPermission().catch(() => {});
            }, 3000);
          }
        `,
      }}
    />
  );
}
