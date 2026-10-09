export const metadata = {
  title: 'LMMS',
  description: 'Laundry Marketing Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
