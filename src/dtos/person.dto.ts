/**
 * Person data structure matching Android app PersonDTO
 * 
 * Based on: https://github.com/MaxMayoris/estacion-dulce-android
 */
export interface Person {
  id: string;
  name: string;
  lastName: string;
  type: string;
  phones: Phone[];
  addresses: string[];
}

/**
 * Phone data structure
 */
export interface Phone {
  phoneNumberPrefix: string;
  phoneNumberSuffix: string;
}

/**
 * Address data structure
 */
export interface Address {
  label: string;
  formattedAddress: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Person creation/update input (without id)
 */
export interface PersonInput {
  name: string;
  lastName: string;
  type: string;
  phones: Phone[];
  addresses: string[];
}
