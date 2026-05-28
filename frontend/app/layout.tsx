import "./globals.css";

export const metadata = {
  title: "WeatherWise Travel Dashboard",
  description: "PM Accelerator AI Engineer Internship Assessment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}