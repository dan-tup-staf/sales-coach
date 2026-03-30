import './globals.css';

export const metadata = {
  title: 'Sales Coach — Dashboard',
  description: 'Analiza rozmów sprzedażowych dla zespołu',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
