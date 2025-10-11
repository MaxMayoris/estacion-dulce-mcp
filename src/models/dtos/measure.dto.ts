/**
 * Measure data structure matching Android app Measure DTO
 * 
 * Based on: https://github.com/MaxMayoris/estacion-dulce-android
 */
export interface Measure {
  id: string;
  name: string;
  unit: string;
}

/**
 * Measure creation/update input (without id)
 */
export interface MeasureInput {
  name: string;
  unit: string;
}
