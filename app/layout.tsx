import { Providers } from "./components/Providers";
import "./globals.css";

export const metadata = {
  title: "Planner App",
  description: "Sync your paper planner to Google Calendar",
};

// Explicitly telling TypeScript that children is a React Node fixes the red line!
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}