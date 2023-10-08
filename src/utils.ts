export function random({min, max}: {min: number, max: number}): number {
  return min + Math.round(Math.random() * (max - min));
}

export function scale(value: number, multiplier: number): number {
  return Math.round(value * multiplier);
}