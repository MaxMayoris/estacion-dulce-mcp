import { Person } from '../dtos/person.dto';
import { EPersonType } from '../enums/person.enum';

/**
 * Compact person projection for persons#index resource
 * Redacted - NO PII (no email, phone, address)
 * Includes type: CLIENT, PROVIDER, etc.
 */
export interface PersonIndexProjection {
  id: string;
  displayName: string;
  type: EPersonType | string;
}

/**
 * Convert Person DTO to redacted index projection
 * Removes all PII (phones, addresses)
 */
export function toPersonIndexProjection(person: Person): PersonIndexProjection {
  return {
    id: person.id,
    displayName: `${person.name} ${person.lastName}`.trim(),
    type: person.type || 'UNKNOWN' // EPersonType.CLIENT, EPersonType.PROVIDER
  };
}

/**
 * Sort persons deterministically for stable ETags
 */
export function sortPersonsForIndex(persons: PersonIndexProjection[]): PersonIndexProjection[] {
  return persons.sort((a, b) => a.id.localeCompare(b.id));
}
