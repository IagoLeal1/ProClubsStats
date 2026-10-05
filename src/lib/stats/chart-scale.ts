export interface ChartScale {
  domain: [number, number];
  tickStep: number;
}

/** Escala de notas para colunas: sempre de 0 a 10 (coluna parte do zero). */
export function ratingScale(): ChartScale {
  return { domain: [0, 10], tickStep: 2 };
}

/** Escala "redonda" para valores grandes (ex.: skill rating). */
export function roundedScale(values: number[], step: number): ChartScale {
  const min = Math.floor((Math.min(...values) - step / 2) / step) * step;
  const max = Math.ceil((Math.max(...values) + step / 2) / step) * step;
  const span = max - min;
  return { domain: [min, max], tickStep: span / step > 6 ? step * 2 : step };
}
