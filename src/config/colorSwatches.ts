const SWATCHES: Record<string, string> = {
  black: '#1A1A1A',
  white: '#FFFFFF',
  navy: '#1B2A57',
  'royal blue': '#2653C4',
  charcoal: '#3E434B',
  'heather grey': '#A9ADB5',
  grey: '#9AA0A9',
  'forest green': '#245B3A',
  olive: '#6B6B2A',
  lime: '#B7D63A',
  teal: '#14807A',
  burgundy: '#6E1E36',
  red: '#C62828',
};

/** Display swatch for a color name. Unknown names fall back to a neutral grey. */
export function getColorSwatch(name: string): string {
  return SWATCHES[name.trim().toLowerCase()] ?? '#B4BAC4';
}
