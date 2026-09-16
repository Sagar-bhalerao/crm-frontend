import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "./globals.css";

import Providers from "./providers";
import { APP_NAME } from "@/config/app";

export const metadata = {
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  description: "Lead management for Imagicaa World brands",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#152033",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
