export interface ILokalanSadrzaj {
  id: number;
  naziv: string;
  putanja: string;
  tip: 'slika' | 'video';
  velicina_bajt: number;
  privatan: 1 | 0;
  kreirano: string;
}

export interface ILokalanSadrzajRezultat {
  sadrzaj: ILokalanSadrzaj[];
  stranica: number;
  ukupnoStranica: number;
}
