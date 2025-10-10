import { Person } from '../dtos/person.dto';

/**
 * Compact person projection for persons#index resource
 * Redacted - NO PII (no email, phone, address)
 */
export interface PersonIndexProjection {
  id: string;
  displayName: string;
  tags: string[];
}

/**
 * Convert Person DTO to redacted index projection
 * Removes all PII (phones, addresses)
 */
export function toPersonIndexProjection(person: Person): PersonIndexProjection {
  return {
    id: person.id,
    displayName: `${person.name} ${person.lastName}`.trim(),
    tags: [person.type] // Type as tag (client, provider, etc)
  };
}

/**
 * Sort persons deterministically for stable ETags
 */
export function sortPersonsForIndex(persons: PersonIndexProjection[]): PersonIndexProjection[] {
  return persons.sort((a, b) => a.id.localeCompare(b.id));
}
