import { Movement } from '../dtos/movement.dto';
import { toDate, toISODateString } from '../../utils/date-utils';

/**
 * Aggregated movement projection for movements#last-30d resource
 */
export interface MovementAggregatedProjection {
  date: string;
  type: string;
  qty: number;
  total: number;
}

/**
 * Aggregate movements by date and type
 */
export function aggregateMovements(movements: Movement[]): MovementAggregatedProjection[] {
  const aggregated = new Map<string, MovementAggregatedProjection>();

  movements.forEach(movement => {
    const date = toISODateString(movement.movementDate);
    const key = `${date}-${movement.type}`;

    if (!aggregated.has(key)) {
      aggregated.set(key, {
        date,
        type: movement.type || 'unknown',
        qty: 0,
        total: 0
      });
    }

    const agg = aggregated.get(key)!;
    agg.qty += movement.items.length;
    agg.total += movement.totalAmount;
  });

  return Array.from(aggregated.values()).sort((a, b) => 
    b.date.localeCompare(a.date) // Most recent first
  );
}

/**
 * Filter movements from last 30 days
 */
export function filterLast30Days(movements: Movement[]): Movement[] {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return movements.filter(m => {
    const movementDate = toDate(m.movementDate);
    return movementDate >= thirtyDaysAgo;
  });
}
