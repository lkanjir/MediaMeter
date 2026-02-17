import { SpolDAO } from "../dao/spolDAO.js";

const korimeRegex = /^[a-z][a-z0-9._-]{0,49}$/;
const lozinkaRegex = /^\S.{2,255}$/;

export function provjeriKorime(kljuc: string, vrijednost: unknown) : string | null{
    if(typeof vrijednost != "string" || vrijednost.trim().length == 0) 
        return "Korisnicko ime je obavezno!";
    
    if(!korimeRegex.test(vrijednost))
        return "Korisnicko ime mora imati najmanje jedan znak koji moze biti: slovo, broj, tocka, minus(-) ili donja crta (_)!";

    return null;
}

export function provjeriLozinku(kljuc: string, vrijednost: unknown) : string | null{
    if(typeof vrijednost != "string" || vrijednost.trim().length == 0) 
        return "Lozinka je obavezna!";
    
    if(!lozinkaRegex.test(vrijednost))
        return  "Lozinka mora imati tri ili više znakova, prvi znak ne smije biti razmak.";
    
    return null;
}

const emailRegex = /^(?=.{5,100}$)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

export function provjeriEmail(kljuc: string, vrijednost: unknown) : string | null{
    if(typeof vrijednost != "string" || vrijednost.trim().length == 0)
        return "E-mail je obavezan!"
    if(!emailRegex.test(vrijednost))
        return "Adresa e-pošte nije ispravna!"

    return null;
}

const datumRegex = /^([1-9]|0[1-9]|[12][0-9]|3[01])\.(0?[1-9]|1[0-2])\.(19|20)\d{2}$/;

export function provjeriDatum(kljuc: string, vrijednost : unknown) : string | null{
    const greska = "Datum mora biti formata datum.mjesec.godina";

    if(vrijednost == null || vrijednost == "") return null;

    if(typeof vrijednost != "string")
        return greska;

    if(!datumRegex.test(vrijednost)) 
        return greska;

    const [dan, mjesec, godina] = vrijednost.split(".");
    const danInt = parseInt(dan!);
    const mjesecInt = parseInt(mjesec!);
    const godinaInt = parseInt(godina!);

    const d = new Date(godinaInt,mjesecInt-1,danInt);

    if(d.getDate() == danInt && d.getMonth() + 1 == mjesecInt && d.getFullYear() == godinaInt)
        return null;

    return greska;
}

const imePrezimeRegex = /^[A-Za-zČčĆćŽžŠšĐđ][A-Za-zČčĆćŽžŠšĐđ -]{0,49}$/;

export function provjeriImePrezime(kljuc: string, vrijednost: unknown) : string | null{
    if(vrijednost == null || vrijednost == "") return null;

    if(typeof vrijednost != "string")
        return `Unesena neispravna vrijednost u polje ${kljuc}.`
    
    if(!imePrezimeRegex.test(vrijednost))
        return `Unesena neispravna vrijednost u polje ${kljuc} (dozvoljena slova, crtice i razmaci).`
    
    return null;
}

const tekstRegex = /^[^<>]{0,256}$/;

export function provjeriTekst(kljuc: string, vrijednost: unknown) : string | null{
    if(vrijednost == null || vrijednost == "") return null;

    if(typeof vrijednost != "string")
        return `Unesena neispravna vrijednost u polje ${kljuc}.`

    if(!tekstRegex.test(vrijednost)){
        return `Unesena neispravna vrijednost u polje ${kljuc}. Zabranjeni znakovi < i >, maksimalan broj znakova: 256`
    }

    return null;
}

export async function provjeriSpol(kljuc: string, vrijednost: unknown) : Promise<string | null>{
    if(vrijednost == null || vrijednost == "") return null

    if(typeof vrijednost != "string"){
        return `Unesena neispravna vrijednost u polje ${kljuc}.`
    }
    
    const odabraniId = parseInt(vrijednost);
    if(Number.isNaN(odabraniId)){
        return `Unesena neispravna vrijednost u polje ${kljuc}.`
    }

    const spol = await new SpolDAO().dajPoId(odabraniId);
    
    return spol ? null : `Odabrana je neispravna vrijednost za ${kljuc}.`
}
