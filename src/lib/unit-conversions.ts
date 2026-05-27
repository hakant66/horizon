export type UnitConversionKey =
  | "kWh_to_GJ"
  | "GJ_to_kWh"
  | "m3_gas_to_kWh"
  | "kWh_to_m3_gas"
  | "kg_lpg_to_L"
  | "L_lpg_to_kg"
  | "L_diesel_to_kg"
  | "kg_diesel_to_L"
  | "L_petrol_to_kg"
  | "kg_petrol_to_L";

const FACTORS: Record<UnitConversionKey, number> = {
  kWh_to_GJ:      0.0036,
  GJ_to_kWh:      277.778,
  m3_gas_to_kWh:  10.55,   // Turkey lower heating value
  kWh_to_m3_gas:  1 / 10.55,
  kg_lpg_to_L:    1 / 0.51,
  L_lpg_to_kg:    0.51,
  L_diesel_to_kg: 0.835,
  kg_diesel_to_L: 1 / 0.835,
  L_petrol_to_kg: 0.745,
  kg_petrol_to_L: 1 / 0.745,
};

export function convert(value: number, key: UnitConversionKey): number {
  return value * FACTORS[key];
}

export function getConversionFactor(key: UnitConversionKey): number {
  return FACTORS[key];
}

/** Returns available conversion keys for a given source unit */
export function getConversionsFrom(unit: string): UnitConversionKey[] {
  const map: Record<string, UnitConversionKey[]> = {
    kWh:  ["kWh_to_GJ", "kWh_to_m3_gas"],
    GJ:   ["GJ_to_kWh"],
    m3:   ["m3_gas_to_kWh"],
    "L":  ["L_diesel_to_kg", "L_petrol_to_kg", "L_lpg_to_kg"],
    kg:   ["kg_diesel_to_L", "kg_petrol_to_L", "kg_lpg_to_L"],
  };
  return map[unit] ?? [];
}
