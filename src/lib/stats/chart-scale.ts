export interface ChartScale {
  domain: [number, number];
  tickStep: number;
}

/** Escala de notas: termina em 10 e começa um pouco abaixo da menor nota. */
export function ratingScale(values: number[]): ChartScale {
  const min = Math.max(0, Math.min(5, Math.floor(Math.min(...values)) - 1));
  return { domain: [min, 10], tickStep: 10 - min > 6 ? 2 : 1 };
}

/** Escala "redonda" para valores grandes (ex.: skill rating). */
export function roundedScale(values: number[], step: number): ChartScale {
  const min = Math.floor((Math.min(...values) - step / 2) / step) * step;
  const max = Math.ceil((Math.max(...values) + step / 2) / step) * step;
  const span = max - min;
  return { domain: [min, max], tickStep: span / step > 6 ? step * 2 : step };
}
