/**
 * Scenario library.
 *
 * Each scenario is a hand-written prefill for the calculator, not a generated
 * page. It exists because the calculator on its own is a tool with a cold
 * start: a reader arriving from search has to know which rows to add before
 * they get any answer. A scenario hands them the load and the reasoning.
 *
 * Rules that keep these pages honest (docs/05-content-and-seo.md):
 *   - Every row references a device id in src/data/devices.ts. An unknown id
 *     throws at build time rather than silently producing a wrong load.
 *   - The page states which limit binds before it names any model. The answer
 *     to "what size" is incomplete without "and here is what fails first".
 *   - Device wattages in the library are engineering ranges, not measurements.
 *     The copy says so and never presents a scenario result as a measurement.
 *   - No programmatic expansion. Five scenarios a human wrote and can defend,
 *     not five hundred generated from a template.
 */

import { devices } from './devices.ts';
import type { DeviceInput, MatchableStation } from '../lib/calculate.ts';
import {
  sizeSystem,
  chargePlan,
  matchStations,
  catalogLimit,
  type MatchResult,
  type SizingResult,
  type ChargePlan,
} from '../lib/calculate.ts';

export interface ScenarioRow {
  /** Device library id. */
  id: string;
  hours?: number;
  watts?: number;
  dutyCycle?: number;
  /** Why this row is in the scenario, shown in the load table. */
  why?: string;
}

export interface Scenario {
  id: string;
  /** H1 and the scenario index label. */
  title: string;
  /** The search-shaped question this page answers. */
  question: string;
  /** One-paragraph summary for the index and the meta description. */
  lede: string;
  rows: ScenarioRow[];
  backupDays: number;
  sunHours: number;
  /** Adds the medical-adjacency disclaimer. */
  medical?: boolean;
  /** Adds the backfeed and transfer-switch warning. */
  electrical?: boolean;
  /** Which limit usually binds, in plain language. */
  insight: string;
  /** What a reader should cut first when nothing fits. */
  trim: string;
  faq: { q: string; a: string }[];
}

const byId = new Map(devices.map((d) => [d.id, d]));

export const scenarios: Scenario[] = [
  {
    id: 'cpap-overnight',
    title: 'CPAP overnight, humidifier off',
    question: 'What size battery runs a CPAP for one night without a humidifier?',
    lede: 'A CPAP running dry draws far less than most people assume. The number that decides the purchase is a full night of hours, not a peak wattage, and the humidifier setting changes it more than any other choice.',
    rows: [
      { id: 'cpap-no-humidifier', hours: 8, why: 'Eight hours is the usual night. Your pressure setting moves this.' },
      { id: 'phone-charge', hours: 2, why: 'One phone charge, for scale next to the machine.' },
    ],
    backupDays: 1,
    sunHours: 5,
    medical: true,
    insight: 'This example estimates energy and continuous output but does not model CPAP startup inrush. Check the machine, adapter, and power-source requirements with your equipment provider.',
    trim: 'Do not shorten prescribed therapy to fit a smaller battery. Ask your equipment provider about compatible backup options and size for your prescribed use.',
    faq: [
      {
        q: 'How many watt hours does a CPAP use in a night?',
        a: 'A machine running without a heated humidifier sits in the 30 to 60 watt range, so eight hours lands near 360 watt hours before conversion losses. Heated humidifiers and heated tubes roughly double that.',
      },
      {
        q: 'Does a CPAP need a surge rating?',
        a: 'This example does not model startup inrush. A CPAP uses a motor-driven blower, and its power supply has its own requirements. Check device and adapter specifications and confirm power-source compatibility with your equipment provider.',
      },
    ],
  },
  {
    id: 'cpap-night-humidifier',
    title: 'CPAP overnight, humidifier and heated tube on',
    question: 'How much more battery does a CPAP need with the humidifier on?',
    lede: 'The heated humidifier is the largest variable in CPAP backup sizing. Treating it as the same load as a dry machine understates the battery by enough to matter, which is why the device library keeps them as two separate entries.',
    rows: [
      { id: 'cpap-humidifier', hours: 8, why: 'Heating adds roughly 25 to 50 W, and the heater cycles through the night.' },
      { id: 'phone-charge', hours: 2, why: 'One phone charge, for scale next to the machine.' },
    ],
    backupDays: 1,
    sunHours: 5,
    medical: true,
    insight: 'Heating increases the estimated energy and continuous draw. Startup inrush is not modelled in this example; it is not confirmation that a power source is compatible.',
    trim: 'Only change humidifier or heated-tube settings if your equipment provider or clinician confirms that the change is appropriate for your prescribed therapy. Otherwise size the backup for your usual settings.',
    faq: [
      {
        q: 'Why is the humidifier treated as a separate device?',
        a: 'Because collapsing the two into one default produces an answer that is wrong in the direction that matters most. A dry machine and a heated one differ by roughly half the recommended capacity.',
      },
      {
        q: 'Is a power station a medical device?',
        a: 'No. A portable power station is a consumer battery, not a medical device, and it is not a substitute for the battery system your equipment manufacturer specifies. Confirm your backup plan with your equipment provider and your clinician before an outage.',
      },
    ],
  },
  {
    id: 'fridge-outage',
    title: 'Fridge through an outage, plus router and lights',
    question: 'What size power station runs a fridge, router, and lights during an outage?',
    lede: 'The compressor start, not the daily energy, is the usual reason a station fails this load. A unit with enough watt hours can still refuse to start a fridge, and that is the failure this page exists to make visible before you buy.',
    rows: [
      { id: 'fridge-home', hours: 8, why: 'The compressor cycles, so average draw sits far below the nameplate.' },
      { id: 'wifi-router', hours: 8, why: 'Keeps the connection alive so the outage is not also an information blackout.' },
      { id: 'led-light', hours: 5, why: 'A few lamps for the evening.' },
      { id: 'phone-charge', hours: 2, why: 'One phone charge.' },
    ],
    backupDays: 1,
    sunHours: 5,
    electrical: true,
    insight: 'A fridge startup lands near 1,200 W on most full-size models, which is far above its 150 W running draw. A station whose peak figure is a resistive boost is not treated here as clearing that start.',
    trim: 'Run the fridge alone on its own station, or accept a shorter fridge window. Cutting the router and lights does almost nothing to the capacity number, because the compressor dominates both figures.',
    faq: [
      {
        q: 'Why does the fridge need so much more peak than continuous?',
        a: 'The compressor motor draws a brief inrush when it starts, commonly several times its running wattage. A station can hold plenty of energy and still not survive that instant.',
      },
      {
        q: 'What is a boost rating, and why is it separated?',
        a: 'Some manufacturers publish a rating for resistive loads, labelled X-Boost, Power Lifting, or similar. That figure does not describe how the inverter behaves against a motor start, so this site records it but does not use it to clear a compressor.',
      },
    ],
  },
  {
    id: 'camping-day',
    title: 'Camping day: 12V fridge, laptop, light, phone',
    question: 'What size portable power station do I need for a day of camping?',
    lede: 'A camping load is dominated by the 12V fridge and by whether you plan to work from the site. It is a gentler load than a home outage, with a much smaller startup surge.',
    rows: [
      { id: 'fridge-portable', hours: 12, why: 'A 12V compressor fridge cycles through the day.' },
      { id: 'laptop', hours: 4, why: 'Working from the site draws more than a charged laptop running alone.' },
      { id: 'led-light', hours: 5, why: 'Evening light.' },
      { id: 'phone-charge', hours: 2, why: 'One phone charge.' },
    ],
    backupDays: 1,
    sunHours: 5,
    insight: 'The 12V fridge startup is real but modest, near 500 W, so most mid-size stations clear it. Capacity, not output, is usually the binding limit.',
    trim: 'Dropping the laptop hours is the fastest way to shrink the recommendation, because four hours of a 60 W charger is a quarter of the day.',
    faq: [
      {
        q: 'Is a 12V fridge easier to run than a home fridge?',
        a: 'Yes, on both figures. Its running draw is lower and its compressor start is smaller, which is why a mid-size station can clear it where a full-size home fridge would block.',
      },
      {
        q: 'Should I size for one day or two?',
        a: 'Size for the days you will be away from a wall outlet. The backup days control multiplies the recommendation directly, so changing it from one to two doubles the battery you are shopping for.',
      },
    ],
  },
  {
    id: 'work-from-home-outage',
    title: 'Work-from-home outage: router, laptop, lights, phone',
    question: 'What size power station keeps Wi-Fi and a laptop up during an outage?',
    lede: 'No compressor. The load is hours of router, laptop, lights, a phone, and a few hours of TV. Capacity binds first. A boost-only peak still covers this mix because nothing here has a motor start.',
    rows: [
      { id: 'wifi-router', hours: 8, why: 'Keeps the connection up for the whole work block.' },
      { id: 'laptop', hours: 6, why: 'Charging while working is the high end of laptop draw.' },
      { id: 'led-light', hours: 5, why: 'Evening light after the outage starts late.' },
      { id: 'phone-charge', hours: 2, why: 'One phone charge.' },
      { id: 'tv', hours: 3, why: 'A few hours of news or a screen after work, not all day.' },
    ],
    backupDays: 1,
    sunHours: 5,
    insight: 'Simultaneous draw sits near 193 W with no modelled surge, so mid-size inverters clear output. The shop figure is watt-hours after inverter loss and reserve. A station that fails a fridge start can still cover this load.',
    trim: 'Drop the TV hours first. The laptop and router are the job; the television is spare.',
    faq: [
      {
        q: 'Why does this load not care about surge?',
        a: 'None of these devices has a compressor or a tool motor in this library. Router, laptop, lights, phone, and a typical LCD television are treated as running watts only. A fridge outage is a different scenario.',
      },
      {
        q: 'Will a 500Wh pack cover a work day?',
        a: 'Usually not, once inverter loss and reserve are in. Six hours of a 60 W laptop plus eight hours of a router already spends most of a 500 Wh nameplate. Open the calculator and change laptop hours if you work from battery rather than from the charger.',
      },
    ],
  },
  {
    id: 'power-tool-off-grid',
    title: 'Running a power tool off grid',
    question: 'Can a portable power station run a circular saw?',
    lede: 'Power tools invert the usual advice. The running draw is large, but the motor startup is larger, and a station that covers the watts can still trip on the first trigger pull. This is the clearest case where a boost rating is not the same thing as a surge rating.',
    rows: [
      { id: 'power-tool', hours: 1, dutyCycle: 0.3, why: 'A saw runs in bursts, so duty cycle matters more than the hour figure.' },
      { id: 'led-light', hours: 5, why: 'Work light.' },
    ],
    backupDays: 1,
    sunHours: 5,
    electrical: true,
    insight: 'The motor start near 2,400 W is the whole problem, and it is a rating question rather than a capacity one. Several units in the database do publish a 3,600 W inverter surge and clear it, so the constraint is size and price. The models that advertise a resistive boost figure instead are not counted here, because that number does not describe a motor start.',
    trim: 'A tool with a soft-start motor changes this answer more than a bigger battery does. Cutting hours lowers the daily energy but leaves the startup exactly where it was.',
    faq: [
      {
        q: 'Why can a station run a heater but not a saw of the same wattage?',
        a: 'A heater is a resistive load with no startup spike. A saw has a motor, which draws a brief inrush several times its running wattage. The inverter has to survive that instant, not just the average.',
      },
      {
        q: 'Does a bigger battery fix a startup problem?',
        a: 'No. Capacity and surge are separate limits. A larger battery with the same inverter still cannot start the motor, which is why the checks here are listed separately.',
      },
    ],
  },
];

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}

/**
 * Turn a scenario into calculator rows. Throws on an unknown device id so a
 * typo fails the build instead of quietly shrinking the load.
 */
export function resolveScenario(scenario: Scenario): DeviceInput[] {
  return scenario.rows.map((row) => {
    const device = byId.get(row.id);
    if (!device) {
      throw new Error(`scenario "${scenario.id}" references unknown device id "${row.id}"`);
    }
    return {
      id: device.id,
      label: device.label,
      watts: row.watts ?? device.typical_w,
      hours: row.hours ?? device.default_hours,
      dutyCycle: row.dutyCycle ?? device.duty_cycle,
      surgeWatts: device.surge_w,
    };
  });
}

/** The `load=` query value the calculator already parses on arrival. */
export function scenarioQuery(scenario: Scenario): string {
  return resolveScenario(scenario)
    .map((d) => `${d.id}:${d.watts}:${d.hours}:${d.dutyCycle}`)
    .join(',');
}

export interface ScenarioAnalysis {
  rows: DeviceInput[];
  sizing: SizingResult;
  plan: ChargePlan;
  match: MatchResult;
  limit: ReturnType<typeof catalogLimit>;
}

/**
 * Everything a scenario page renders, computed from the same library the live
 * calculator uses. `/calculator/#calculator?load=...` reproduces these numbers exactly,
 * which is the point: the static page cannot drift from the tool.
 */
export function analyzeScenario(
  scenario: Scenario,
  catalog: MatchableStation[],
): ScenarioAnalysis {
  const rows = resolveScenario(scenario);
  const sizing = sizeSystem(rows);
  const plan = chargePlan(sizing.rawDailyWh, sizing.recommendedWh, {
    backupDays: scenario.backupDays,
    sunHours: scenario.sunHours,
  });
  const load = {
    recommendedWh: plan.recommendedWh,
    simultaneousW: sizing.simultaneousW,
    peakSurgeW: sizing.peakSurgeW,
  };
  return { rows, sizing, plan, match: matchStations(catalog, load), limit: catalogLimit(catalog, load) };
}
