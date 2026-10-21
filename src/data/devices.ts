/**
 * Device power library.
 *
 * Every entry carries a source_type and, where the figure comes from a
 * manufacturer or standards body, a source_url. Values marked "estimated"
 * are engineering ranges used to seed the calculator, NOT measurements.
 *
 * Compliance rule (docs/04-compliance.md, CIAP section):
 * CPAP with and without a heated humidifier are TWO SEPARATE entries with
 * different wattages. They must never be collapsed into one default.
 */

export type SourceType = 'official' | 'standards' | 'estimated';

export interface Device {
  id: string;
  label: string;
  /** Typical continuous draw in watts. */
  typical_w: number;
  /** Surge / inrush watts, where the device has a motor or compressor. */
  surge_w: number | null;
  /** Fraction of the time the device actually draws power in an hour (0-1). */
  duty_cycle: number;
  /** Default hours per day the user is likely to want it running. */
  default_hours: number;
  source_type: SourceType;
  source_url: string | null;
  note?: string;
  /** Groups the device in the picker UI. */
  group: 'medical' | 'cooling' | 'comms' | 'lighting' | 'entertainment' | 'kitchen' | 'tools';
}

export const devices: Device[] = [
  {
    id: 'cpap-no-humidifier',
    label: 'CPAP / BiPAP (humidifier OFF)',
    typical_w: 45,
    surge_w: null,
    duty_cycle: 1,
    default_hours: 8,
    source_type: 'estimated',
    source_url: null,
    note: 'Published ranges cluster at 30-60 W. Pressure setting and mask leak both move this.',
    group: 'medical',
  },
  {
    id: 'cpap-humidifier',
    label: 'CPAP / BiPAP (humidifier and heated tube ON)',
    typical_w: 80,
    surge_w: null,
    duty_cycle: 1,
    default_hours: 8,
    source_type: 'estimated',
    source_url: null,
    note: 'Heating adds roughly 25-50 W. On many machines the heater cycles, so real draw varies through the night.',
    group: 'medical',
  },
  {
    id: 'fridge-home',
    label: 'Home refrigerator (full size)',
    typical_w: 150,
    surge_w: 1200,
    duty_cycle: 0.35,
    default_hours: 8,
    source_type: 'estimated',
    source_url: null,
    note: 'The compressor cycles, so average draw is far below the nameplate. Startup is the hard part.',
    group: 'cooling',
  },
  {
    id: 'fridge-portable',
    label: 'Portable 12V fridge (van, camping)',
    typical_w: 55,
    surge_w: 500,
    duty_cycle: 0.4,
    default_hours: 12,
    source_type: 'estimated',
    source_url: null,
    note: 'Compressor startup can spike to several hundred watts for a fraction of a second.',
    group: 'cooling',
  },
  {
    id: 'freezer-chest',
    label: 'Chest freezer',
    typical_w: 200,
    surge_w: 1400,
    duty_cycle: 0.3,
    default_hours: 8,
    source_type: 'estimated',
    source_url: null,
    group: 'cooling',
  },
  {
    id: 'wifi-router',
    label: 'Wi-Fi router / modem',
    typical_w: 12,
    surge_w: null,
    duty_cycle: 1,
    default_hours: 8,
    source_type: 'estimated',
    source_url: null,
    group: 'comms',
  },
  {
    id: 'phone-charge',
    label: 'Phone charge',
    typical_w: 12,
    surge_w: null,
    duty_cycle: 1,
    default_hours: 2,
    source_type: 'estimated',
    source_url: null,
    note: 'Roughly 10-20 Wh per full charge. Editing the hours is a rough stand-in for charges per day.',
    group: 'comms',
  },
  {
    id: 'laptop',
    label: 'Laptop',
    typical_w: 60,
    surge_w: null,
    duty_cycle: 1,
    default_hours: 4,
    source_type: 'estimated',
    source_url: null,
    note: 'Charging while working draws the high end. A charged laptop running only draws 15-30 W.',
    group: 'comms',
  },
  {
    id: 'led-light',
    label: 'LED lamp',
    typical_w: 9,
    surge_w: null,
    duty_cycle: 1,
    default_hours: 5,
    source_type: 'estimated',
    source_url: null,
    group: 'lighting',
  },
  {
    id: 'tv',
    label: 'Television',
    typical_w: 100,
    surge_w: null,
    duty_cycle: 1,
    default_hours: 4,
    source_type: 'estimated',
    source_url: null,
    note: 'Large OLED panels run higher than the 60-100 W of a typical LCD.',
    group: 'entertainment',
  },
  {
    id: 'microwave',
    label: 'Microwave',
    typical_w: 1000,
    surge_w: null,
    duty_cycle: 1,
    default_hours: 0.5,
    source_type: 'estimated',
    source_url: null,
    note: 'Cooking times are short, so hours here are usually well under 1.',
    group: 'kitchen',
  },
  {
    id: 'coffee-maker',
    label: 'Drip coffee maker',
    typical_w: 900,
    surge_w: null,
    duty_cycle: 1,
    default_hours: 0.3,
    source_type: 'estimated',
    source_url: null,
    group: 'kitchen',
  },
  {
    id: 'space-heater',
    label: 'Space heater',
    typical_w: 1500,
    surge_w: null,
    duty_cycle: 0.5,
    default_hours: 4,
    source_type: 'estimated',
    source_url: null,
    note: 'Resistive heaters are the single fastest way to drain a battery. Most mid-size stations cannot run one for long.',
    group: 'tools',
  },
  {
    id: 'power-tool',
    label: 'Circular saw / power tool',
    typical_w: 1200,
    surge_w: 2400,
    duty_cycle: 0.3,
    default_hours: 1,
    source_type: 'estimated',
    source_url: null,
    note: 'Motor startup is the constraint, not the running draw.',
    group: 'tools',
  },
];

export const deviceGroups: { id: Device['group']; label: string }[] = [
  { id: 'medical', label: 'Medical' },
  { id: 'cooling', label: 'Cooling' },
  { id: 'comms', label: 'Comms and computing' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'tools', label: 'Tools and heat' },
];
