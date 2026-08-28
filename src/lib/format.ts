export const fmtInt = (n: number): string => n.toLocaleString("ru-RU");

export const fmtDec = (n: number): string =>
  n.toLocaleString("ru-RU", { maximumFractionDigits: 2 });
