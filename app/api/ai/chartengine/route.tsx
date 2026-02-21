
import { generateChartConfig } from '@/lib/ai/actions';
import { Config, Result } from '@/lib/ai/types';

const DEFAULT_QUERY = `WITH latest_date AS (
  SELECT MAX(as_of_date) AS max_date FROM risk_mv FINAL
)
SELECT
  counterparty_name,
  sum(funding_amount) as total_funding_amount,
  count(*) as position_count,
  round(avg(funding_amount), 2) as avg_funding_amount
FROM risk_mv FINAL
WHERE as_of_date = (SELECT max_date FROM latest_date)
GROUP BY counterparty_name
ORDER BY total_funding_amount DESC
LIMIT 10`;

const DEFAULT_RESULTS: Result[] = [
  {
    counterparty_name: 'Hobbs-Garcia',
    total_funding_amount: 4572937476.76,
    position_count: 176,
    avg_funding_amount: 25982599.3,
  },
  {
    counterparty_name: 'Jenkins and Sons',
    total_funding_amount: 4334692452.15,
    position_count: 156,
    avg_funding_amount: 27786490.08,
  },
  {
    counterparty_name: 'Walton, Davidson and Thomas',
    total_funding_amount: 4093317076.27,
    position_count: 157,
    avg_funding_amount: 26072083.29,
  },
];

function sanitizeData(data: unknown): Result[] {
  if (!Array.isArray(data)) {
    return DEFAULT_RESULTS;
  }

  const sanitized = data
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null;
      }

      const entries = Object.entries(item).reduce<Result>((acc, [key, value]) => {
        if (typeof value === 'number' || typeof value === 'string') {
          acc[key] = value;
        } else if (value !== null && value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Result);

      return Object.keys(entries).length ? entries : null;
    })
    .filter((item): item is Result => item !== null);

  return sanitized.length ? sanitized : DEFAULT_RESULTS;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const incomingQuery = typeof body?.query === 'string' ? body.query : DEFAULT_QUERY;
    const incomingData = sanitizeData(body?.data);

    const { config } = await generateChartConfig(incomingData, incomingQuery);

    return Response.json({
      query: incomingQuery,
      rowCount: incomingData.length,
      config,
    } satisfies { query: string; rowCount: number; config: Config });
  } catch (error) {
    console.error('AI chart engine error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate chart configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}


