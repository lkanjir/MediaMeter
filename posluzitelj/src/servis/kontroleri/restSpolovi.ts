import { SpolDAO } from "../dao/spolDAO.js";
import {Request, Response} from "express"

export class RestSpolovi{
    private spolovi;

    constructor(){
        this.spolovi = new SpolDAO();
    }

    getSpolovi(zahtjev: Request, odgovor: Response){
        this.spolovi.dajSve().then((spolovi : Array<ISpol>) => {
            odgovor.json(spolovi);
        })
    } 
}