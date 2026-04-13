// API Route - server-side proxy do Google Sheets (omija CORS)
export async function GET() {
  const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1YztcU-sOvw3vlW3wxQfh5THjqYUZ7ODc-7ZK8xy3LvI/export?format=csv&gid=0';

  try {
    const response = await fetch(SHEET_CSV_URL, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return Response.json(
        { error: 'Failed to fetch data from Google Sheets', status: response.status },
        { status: 502 }
      );
    }

    const csvText = await response.text();

    return new Response(csvText, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error fetching Google Sheets:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
