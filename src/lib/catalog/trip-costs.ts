/**
 * Indicative on-the-ground cost per traveller per day, in USD: a share of a
 * double room plus food, local transport and a modest activity budget.
 * "budget" ≈ hostels/guesthouses and street food; "comfort" ≈ 3–4★ hotels
 * and sit-down restaurants. Replace with a live data source when available.
 */
export const DAILY_COSTS: Record<string, { budget: number; comfort: number }> = {
  DOH: { budget: 70, comfort: 190 },
  DXB: { budget: 80, comfort: 220 },
  AUH: { budget: 75, comfort: 200 },
  MCT: { budget: 60, comfort: 160 },
  CAI: { budget: 35, comfort: 110 },
  IST: { budget: 50, comfort: 140 },
  TBS: { budget: 35, comfort: 100 },
  GYD: { budget: 45, comfort: 120 },
  LHR: { budget: 120, comfort: 280 },
  CDG: { budget: 110, comfort: 260 },
  AMS: { budget: 110, comfort: 250 },
  FCO: { budget: 90, comfort: 220 },
  BCN: { budget: 85, comfort: 210 },
  LIS: { budget: 70, comfort: 180 },
  PRG: { budget: 60, comfort: 150 },
  ATH: { budget: 65, comfort: 170 },
  BOM: { budget: 35, comfort: 120 },
  DEL: { budget: 30, comfort: 110 },
  CMB: { budget: 35, comfort: 110 },
  MLE: { budget: 90, comfort: 350 },
  KTM: { budget: 25, comfort: 80 },
  BKK: { budget: 35, comfort: 110 },
  HKT: { budget: 45, comfort: 150 },
  SIN: { budget: 90, comfort: 230 },
  KUL: { budget: 40, comfort: 120 },
  DPS: { budget: 35, comfort: 120 },
  HKG: { budget: 95, comfort: 240 },
  NRT: { budget: 85, comfort: 220 },
  SYD: { budget: 110, comfort: 250 },
  ZNZ: { budget: 45, comfort: 150 },
  CPT: { budget: 50, comfort: 140 },
  JFK: { budget: 150, comfort: 330 },
  LAX: { budget: 130, comfort: 300 },
};

export type TravelStyle = "budget" | "comfort";
export const TRAVEL_STYLES: TravelStyle[] = ["budget", "comfort"];
