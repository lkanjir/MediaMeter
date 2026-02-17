export interface IMultimedija {
  id: number;
  putanja: string;
  naziv: string;
  tip: string;
  youtube_kljuc: string | null;
  privatan: 0 | 1;
  lokalni_sadrzaj: 0 | 1;
  velicina_bajt: number | null;
}
