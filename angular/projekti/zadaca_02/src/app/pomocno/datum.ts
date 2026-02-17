export function normalizirajDatum(datumStr: string): string {
  const bezTocke = datumStr.endsWith('.') ? datumStr.slice(0, -1) : datumStr;
  const [dan, mjesec, godina] = bezTocke.split('.');
  const d = dan.padStart(2, '0');
  const m = mjesec.padStart(2, '0');
  return `${godina}-${m}-${d}`;
}
