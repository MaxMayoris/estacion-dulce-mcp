import { Movement } from '../dtos/movement.dto';
import { Person } from '../dtos/person.dto';

/**
 * Client activity projection for clients#recent resource
 * Shows clients with recent purchases (last 30 days)
 */
export interface ClientRecentProjection {
  id: string;
  displayName: string;
  type: string;
  lastPurchase: string;
  purchaseCount: number;
  totalSpent: number;
}

/**
 * Aggregate client purchases from movements
 */
export function aggregateClientPurchases(
  persons: Map<string, Person>,
  movements: Movement[]
): ClientRecentProjection[] {
  const clientStats = new Map<string, {
    lastPurchase: Date;
    purchaseCount: number;
    totalSpent: number;
  }>();

  // Aggregate movements by person
  movements.forEach(movement => {
    if (!movement.personId || movement.type !== 'SALE') return;

    const stats = clientStats.get(movement.personId) || {
      lastPurchase: new Date(0),
      purchaseCount: 0,
      totalSpent: 0
    };

    const movementDate = new Date(movement.movementDate);
    if (movementDate > stats.lastPurchase) {
      stats.lastPurchase = movementDate;
    }

    stats.purchaseCount++;
    stats.totalSpent += movement.totalAmount || 0;

    clientStats.set(movement.personId, stats);
  });

  // Build projections
  const projections: ClientRecentProjection[] = [];

  clientStats.forEach((stats, personId) => {
    const person = persons.get(personId);
    if (!person) return;

    projections.push({
      id: personId,
      displayName: `${person.name} ${person.lastName}`.trim(),
      type: person.type || 'CLIENT',
      lastPurchase: stats.lastPurchase.toISOString().split('T')[0],
      purchaseCount: stats.purchaseCount,
      totalSpent: Math.round(stats.totalSpent * 100) / 100
    });
  });

  return projections;
}

/**
 * Sort clients by last purchase date (most recent first)
 */
export function sortClientsByRecent(clients: ClientRecentProjection[]): ClientRecentProjection[] {
  return clients.sort((a, b) => b.lastPurchase.localeCompare(a.lastPurchase));
}

