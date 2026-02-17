import Baza from "./sqliteBaza.js";

let prava: Record<number, number> = {};

export async function pripremiUloge(){
    const baza = new Baza("podaci/RWA2025lkanjir23.sqlite")
    await baza.spoji();

    const redovi = await baza.dajSve<{id: number, naziv: string, razina_prava: number}>(
        "SELECT id, naziv, razina_prava FROM tip_korisnika",
    )
    
    const mapiraniRedovi : Record<number, number> = {};
    redovi.forEach((red) => {
        mapiraniRedovi[red.id] = red.razina_prava;
    })
    
    prava = mapiraniRedovi;
}

export const dajPravoZaTipKorisnika = (tipKorisnikaId: number | undefined) : number => {
    if(tipKorisnikaId == undefined) return 0;
    
    return prava[tipKorisnikaId] ?? 0;
}