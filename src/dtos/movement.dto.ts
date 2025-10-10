/**
 * Movement data structure matching Android app MovementDTO
 * 
 * Based on: https://github.com/MaxMayoris/estacion-dulce-android
 */
export interface Movement {
  id: string;
  type: string | null;
  personId: string;
  movementDate: string;
  totalAmount: number;
  items: MovementItem[];
  delivery: Delivery | null;
  delta: Record<string, number>;
  appliedAt: string | null;
  createdAt: string | null;
  detail: string;
  kitchenOrderStatus: string | null;
  referenceImages: string[];
  isStock: boolean | null;
}

/**
 * Movement item structure
 */
export interface MovementItem {
  collection: string;
  collectionId: string;
  customName: string | null;
  cost: number;
  quantity: number;
}

/**
 * Delivery data structure
 */
export interface Delivery {
  type: string;
  date: string;
  status: string;
  shipment: ShipmentDetails | null;
}

/**
 * Shipment details structure
 */
export interface ShipmentDetails {
  addressId: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  cost: number;
  calculatedCost: number;
}

/**
 * Movement creation/update input (without id)
 */
export interface MovementInput {
  type: string | null;
  personId: string;
  movementDate: string;
  totalAmount: number;
  items: MovementItem[];
  delivery: Delivery | null;
  delta: Record<string, number>;
  detail: string;
  kitchenOrderStatus: string | null;
  referenceImages: string[];
  isStock: boolean | null;
}
