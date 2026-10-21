/**
 * Sizing and runtime math.
 *
 * Formula source: docs/06 (supplementary research) section 3, which superseded
 * the simpler `Wh x 1.2` in docs/02. The differences that matter:
 *   - duty cycle is applied per device (a fridge compressor does not draw its
 *     nameplate wattage continuously)
 *   - inverter efficiency is applied as a divisor, so losses increase the
 *     recommended capacity rather than being ignored
 *   - surge watts are checked separately against the station's peak output
 *
 * Every number this module returns is an ESTIMATE. The UI must say so.
 */

export const INVERTER_EFFICIENCY = 0.85;
export const RESERVE_FACTOR = 1.2;
export const USABLE_CAPACITY_FACTOR = 0.85;

export interface DeviceInput {
  id: string;
  label: string;
  watts: number;
  hours: number;
  dutyCycle: number;
  surgeWatts: number | null;
}

export interface DeviceResult extends DeviceInput {
  /** Watt-hours this device contributes per day, after duty cycle. */
  dailyWh: number;
}

export interface StationSpec {
  id: string;
  brand: string;
  model: string;
  capacity_wh: number;
  output_continuous_w: number;
  output_peak_w: number;
  weight_lbs: number | null;
  price_usd_list: number | null;
  best_for: string[];
  affiliate_url: string | null;
  /**
   * When false, output_peak_w is a resistive boost rating (X-Boost, Power
   * Lifting, SurgePad), not an inverter surge. A motor start must not be
   * checked against it.
   */
  peak_is_surge?: boolean;
}

export interface SizingResult {
  /** Sum of device daily Wh, before conversion losses. */
  rawDailyWh: number;
  /** Recommended nameplate capacity a buyer should look for. */
  recommendedWh: number;
  /** Highest single-device surge the station must survive. */
  peakSurgeW: number;
  /** Continuous watts if every selected device ran at once (worst case). */
  simultaneousW: number;
  /** The efficiency actually applied, so the UI can display it truthfully. */
  efficiency: number;
  /** The reserve multiplier actually applied. */
  reserve: number;
  perDevice: DeviceResult[];
}

export interface SizingOptions {
  /** Inverter conversion efficiency, 0 to 1. Divides daily energy. */
  inverterEfficiency?: number;
  /** Reserve multiplier applied on top of conversion losses. 1.2 = 20 percent. */
  reserveFactor?: number;
}

export function sizeSystem(
  devices: DeviceInput[],
  options: SizingOptions = {},
): SizingResult {
  const efficiency = options.inverterEfficiency ?? INVERTER_EFFICIENCY;
  const reserve = options.reserveFactor ?? RESERVE_FACTOR;

  if (!(efficiency > 0 && efficiency <= 1)) {
    throw new RangeError(`inverterEfficiency must be in (0, 1], got ${efficiency}`);
  }
  if (!(reserve >= 1)) {
    throw new RangeError(`reserveFactor must be >= 1, got ${reserve}`);
  }

  const perDevice: DeviceResult[] = devices.map((d) => ({
    ...d,
    dailyWh: d.watts * d.hours * d.dutyCycle,
  }));

  const rawDailyWh = perDevice.reduce((sum, d) => sum + d.dailyWh, 0);
  const recommendedWh = (rawDailyWh / efficiency) * reserve;
  const peakSurgeW = devices.reduce((max, d) => Math.max(max, d.surgeWatts ?? 0), 0);
  const simultaneousW = devices.reduce((sum, d) => sum + d.watts, 0);

  return {
    rawDailyWh,
    recommendedWh,
    peakSurgeW,
    simultaneousW,
    efficiency,
    reserve,
    perDevice,
  };
}

export interface RuntimeResult {
  /**
   * Hours the station lasts with duty cycles applied. This is the realistic
   * figure for something like a fridge, whose compressor cycles on and off.
   */
  averageHours: number;
  /**
   * Hours if every device drew its rated wattage simultaneously and
   * continuously. The pessimistic bound, and what a reader who runs everything
   * at once will actually see.
   */
  worstCaseHours: number;
  /** Continuous watts if all selected devices ran at once. */
  simultaneousW: number;
  /** Highest single-device startup surge. */
  peakSurgeW: number;
  /** True when simultaneous draw exceeds the station's continuous rating. */
  overloaded: boolean;
  /** True when a device surge exceeds the station's peak rating. */
  surgeBlocked: boolean;
  /**
   * True when the record's peak figure is a resistive boost, so a motor surge
   * cannot be checked against it. The station is not cleared for that motor.
   */
  surgeUnverified: boolean;
  /** Which limit fails first, or null when the station covers the load. */
  bindingConstraint: 'capacity' | 'continuous' | 'surge' | 'surge_unverified' | null;
}

/**
 * Reverse calculator: given a station and a total load, how long does it run?
 * Returns the constraint that fails first so the UI can explain the result
 * rather than just printing a number.
 */
export function runtimeFor(
  station: StationSpec,
  devices: DeviceInput[],
  options: { usableCapacityFactor?: number } = {},
): RuntimeResult {
  const usableFactor = options.usableCapacityFactor ?? USABLE_CAPACITY_FACTOR;

  const simultaneousW = devices.reduce((sum, d) => sum + d.watts, 0);
  const peakSurgeW = devices.reduce((max, d) => Math.max(max, d.surgeWatts ?? 0), 0);

  const overloaded = simultaneousW > station.output_continuous_w;
  const peakIsSurge = station.peak_is_surge !== false;
  const surgeBlocked = peakIsSurge && peakSurgeW > station.output_peak_w;
  const surgeUnverified = !peakIsSurge && peakSurgeW > 0;

  const usableWh = station.capacity_wh * usableFactor;

  // Duty-weighted: the same energy budget spread over a load that cycles.
  // A fridge at 150 W and 35 percent duty consumes 52.5 W on average.
  const averageDrawW = devices.reduce((sum, d) => sum + d.watts * d.dutyCycle, 0);
  const averageHours = averageDrawW > 0 ? usableWh / averageDrawW : 0;
  const worstCaseHours = simultaneousW > 0 ? usableWh / simultaneousW : 0;

  // Order matters: surge blocks startup, continuous blocks operation, and
  // capacity only matters once the station can actually run the load.
  const bindingConstraint: RuntimeResult['bindingConstraint'] = surgeBlocked
    ? 'surge'
    : surgeUnverified
      ? 'surge_unverified'
      : overloaded
        ? 'continuous'
        : usableWh <= 0
          ? 'capacity'
          : null;

  return {
    averageHours,
    worstCaseHours,
    simultaneousW,
    peakSurgeW,
    overloaded,
    surgeBlocked,
    surgeUnverified,
    bindingConstraint,
  };
}

export interface ComparedStation {
  station: StationSpec;
  runtime: RuntimeResult;
}

/**
 * Same load against two stations. Order is preserved so the UI can label
 * them A and B without sorting a covered unit ahead of a blocked one.
 */
export function compareStations(
  a: StationSpec,
  b: StationSpec,
  devices: DeviceInput[],
  options: { usableCapacityFactor?: number } = {},
): [ComparedStation, ComparedStation] {
  return [
    { station: a, runtime: runtimeFor(a, devices, options) },
    { station: b, runtime: runtimeFor(b, devices, options) },
  ];
}

export interface ChargePlan {
  dailyWh: number;
  recommendedWh: number;
  backupDays: number;
  usableFraction: number;
  sunHours: number;
  solarNeededW: number;
  solarCoveragePct: number;
  solarWhPerDay: number;
}

export function chargePlan(
  dailyWh: number,
  recommendedWh: number,
  options: {
    backupDays?: number;
    usableFraction?: number;
    sunHours?: number;
    solarInputW?: number;
    inverterEfficiency?: number;
  } = {},
): ChargePlan {
  const backupDays = options.backupDays ?? 1;
  const usableFraction = options.usableFraction ?? USABLE_CAPACITY_FACTOR;
  const sunHours = options.sunHours ?? 5;
  const solarInputW = options.solarInputW ?? 0;
  const efficiency = options.inverterEfficiency ?? INVERTER_EFFICIENCY;

  if (!(backupDays >= 1)) throw new RangeError(`backupDays must be >= 1, got ${backupDays}`);
  if (!(usableFraction > 0 && usableFraction <= 1)) {
    throw new RangeError(`usableFraction must be in (0, 1], got ${usableFraction}`);
  }
  if (!(sunHours > 0)) throw new RangeError(`sunHours must be > 0, got ${sunHours}`);
  if (!(efficiency > 0 && efficiency <= 1)) {
    throw new RangeError(`inverterEfficiency must be in (0, 1], got ${efficiency}`);
  }

  const solarNeededW = dailyWh > 0 ? dailyWh / (sunHours * efficiency) : 0;
  const solarWhPerDay = solarInputW * sunHours * efficiency;
  const solarCoveragePct = dailyWh > 0 ? Math.min(1, solarWhPerDay / dailyWh) : 0;

  return {
    dailyWh,
    recommendedWh: recommendedWh * backupDays,
    backupDays,
    usableFraction,
    sunHours,
    solarNeededW,
    solarCoveragePct,
    solarWhPerDay,
  };
}

/** The station fields the matcher needs. Structural so JSON rows fit directly. */
export interface MatchableStation {
  id: string;
  brand: string;
  model: string;
  capacity_wh: number;
  output_continuous_w: number;
  output_peak_w: number;
  peak_is_surge?: boolean;
}

export interface LoadSummary {
  /** Nameplate capacity a buyer should look for, after loss and reserve. */
  recommendedWh: number;
  /** Continuous watts when every device runs at once. */
  simultaneousW: number;
  /** Highest single-device startup surge, or 0 when nothing has a motor. */
  peakSurgeW: number;
}

export interface StationMatch {
  station: MatchableStation;
  /** Nameplate capacity left over above the recommendation. */
  spareWh: number;
}

export interface MatchResult {
  /** Stations that clear capacity, continuous output, and surge. Smallest first. */
  eligible: StationMatch[];
  /**
   * Stations kept out of the pool because their peak figure is a resistive
   * boost. They are not failures, they are unverifiable for a motor start, and
   * the UI must not present them as if they had been checked.
   */
  unverifiedBoost: MatchableStation[];
  /** True when a motor start exists and no station publishes an inverter surge. */
  noSurgeCheckable: boolean;
  /** The pool the match ran against, for meter scaling. */
  pool: MatchableStation[];
}

export type CatalogLimit =
  | 'capacity'
  | 'continuous'
  | 'surge'
  | 'surge_unverified'
  /** No single limit explains it: each constraint is met by a different model. */
  | 'combination'
  | null;

/**
 * Candidate pool for a load. With a motor start in the load, only stations
 * whose peak is a true inverter surge can be compared against it.
 */
export function poolForLoad(
  stations: MatchableStation[],
  load: LoadSummary,
): MatchableStation[] {
  return load.peakSurgeW > 0 ? stations.filter((s) => s.peak_is_surge !== false) : stations;
}

export function matchStations(
  stations: MatchableStation[],
  load: LoadSummary,
): MatchResult {
  const pool = poolForLoad(stations, load);
  const surgeCheckable = stations.filter((s) => s.peak_is_surge !== false);
  const eligible = pool
    .filter(
      (s) =>
        s.capacity_wh >= load.recommendedWh &&
        s.output_continuous_w >= load.simultaneousW &&
        (load.peakSurgeW === 0 || s.output_peak_w >= load.peakSurgeW),
    )
    .map((station) => ({ station, spareWh: station.capacity_wh - load.recommendedWh }))
    // Smallest adequate model first: the useful answer is the cheapest unit that
    // clears every limit, not the largest one in the database.
    .sort((a, b) => a.station.capacity_wh - b.station.capacity_wh);

  return {
    eligible,
    unverifiedBoost: stations.filter((s) => s.peak_is_surge === false),
    noSurgeCheckable: load.peakSurgeW > 0 && surgeCheckable.length === 0,
    pool,
  };
}

/**
 * Which limit a load hits once nothing in the pool clears it.
 *
 * This works by relaxation rather than by comparing the load against the
 * maximum of each field. Comparing field maxima is wrong: the widest capacity
 * and the highest continuous output in a catalog usually belong to different
 * models, so a load can look coverable while no single station covers it. Here
 * each candidate excuse is tested against real stations, and the first one that
 * would actually admit a station is the binding limit.
 *
 * Order matches runtimeFor: surge blocks startup, continuous blocks operation,
 * capacity is what remains.
 */
export function catalogLimit(
  stations: MatchableStation[],
  load: LoadSummary,
): CatalogLimit {
  const surgeCheckable = stations.filter((s) => s.peak_is_surge !== false);
  if (load.peakSurgeW > 0 && surgeCheckable.length === 0) return 'surge_unverified';
  const pool = poolForLoad(stations, load);
  if (pool.length === 0) return 'surge_unverified';

  const solves = (s: MatchableStation, relaxed: CatalogLimit) =>
    (relaxed === 'capacity' || s.capacity_wh >= load.recommendedWh) &&
    (relaxed === 'continuous' || s.output_continuous_w >= load.simultaneousW) &&
    (relaxed === 'surge' ||
      load.peakSurgeW === 0 ||
      s.output_peak_w >= load.peakSurgeW);

  // Something already covers the load, so no limit binds. Without this check the
  // ladder below would report the last relaxation it tried, which would name a
  // constraint on a load that has none.
  if (pool.some((s) => solves(s, null))) return null;

  // Nothing fits, so at least one of these relaxations must admit a station
  // unless the load needs two improvements at once.
  const ladder: CatalogLimit[] = ['surge', 'continuous', 'capacity'];
  for (const candidate of ladder) {
    if (pool.some((s) => solves(s, candidate))) return candidate;
  }
  return 'combination';
}

/**
 * Whether an array the load needs can actually be plugged into a station, and
 * whether a station's own input limit covers it. Returns null when the
 * manufacturer page does not publish a solar input figure: an unpublished
 * limit is unknown, never a yes.
 */
export function solarArrayFit(
  neededW: number,
  maxInputW: number | null | undefined,
): { fits: boolean; maxInputW: number } | null {
  if (typeof maxInputW !== 'number' || !(maxInputW > 0)) return null;
  return { fits: neededW <= maxInputW, maxInputW };
}

export function encodeScenario(devices: DeviceInput[]): string {
  return devices
    .map((d) => `${d.id}:${d.watts}:${d.hours}:${d.dutyCycle}`)
    .join(',');
}

export function decodeScenario(raw: string): DeviceInput[] | null {
  try {
    return raw.split(',').map((chunk) => {
      const [id, watts, hours, duty] = chunk.split(':');
      const parsed = {
        id,
        label: id,
        watts: Number(watts),
        hours: Number(hours),
        dutyCycle: Number(duty),
        surgeWatts: null,
      };
      if ([parsed.watts, parsed.hours, parsed.dutyCycle].some((n) => !Number.isFinite(n))) {
        throw new Error('bad number');
      }
      return parsed;
    });
  } catch {
    return null;
  }
}
