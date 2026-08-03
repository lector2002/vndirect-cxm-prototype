export type NavItem = {
  g?: string;
  r?: string;
  ic?: string;
  l?: string;
};

export type Meta = Record<string, [string, string]>;

export type TourStop = {
  r: string;
  grp: string;
  sel: string;
  t: string;
  d: string;
};

export type Chip = [string, string];
