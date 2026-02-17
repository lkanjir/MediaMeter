import Baza from "../../zajednicko/sqliteBaza.js";

export class SpolDAO{
    private baza : Baza;
    private bazaSpremna : Promise<void>;

    constructor(){
        this.baza = new Baza("podaci/RWA2025lkanjir23.sqlite");
        this.bazaSpremna = this.baza.spoji();
    }

    async dajSve() : Promise<Array<ISpol>>{
        await this.bazaSpremna;
        return this.baza.dajSve<ISpol>("SELECT * FROM spol")
    }

    async dajPoId(id: number) : Promise<ISpol | null>{
        await this.bazaSpremna;
        const red = await this.baza.dajJedan<ISpol>("SELECT * FROM spol WHERE id = ?",[id]);
        return red ?? null;
    }


} 