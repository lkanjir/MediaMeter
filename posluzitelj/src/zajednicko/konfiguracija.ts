import dsPromise from "fs/promises";
import { IKonfiguracija } from "../sucelja/IKonfiguracija";

export class Konfiguracija {
  private konfiguracija: IKonfiguracija;

  constructor() {
    this.konfiguracija = {
      tajniKljucSesija: "",
      stranicaLimit: "",
      tmdbApiKeyV3: "",
      email: "",
      emailPass: ""
    };
  }

  public dajKonfiguraciju() {
    return this.konfiguracija;
  }

  public async ucitajKonfiguraciju() {
    console.log(this.konfiguracija);

    if (process.argv[2] == undefined)
      throw new Error("Nedostaje putanja do konfiguracijske datoteke!");

    let putanja: string = process.argv[2];
    var podatci: string = await dsPromise.readFile(putanja, {
      encoding: "utf-8",
    });

    this.pretvoriUKonfiguraciju(podatci);
  }

  private pretvoriUKonfiguraciju(podatci: string) {
    const konfiguracija: { [kljuc: string]: string } = {};

    const redovi = podatci.split("\n");

    for (let red of redovi) {
      const podatciReda = red.split("$");
      const naziv = podatciReda[0];

      if (typeof naziv != "string" || naziv == "") continue;

      switch (naziv) {
        case "tajniKljucSesija":
        case "stranicaLimit":
        case "tmdbApiKeyV3":
        case "email":
        case "emailPass":
          var vrijednost: string = podatciReda[1] ?? "";
          konfiguracija[naziv] = vrijednost;
          break;
        default:
          throw new Error(`Nepoznat konfiguracijski podatak: ${naziv}`);
      }
    }

    this.konfiguracija = {
      tajniKljucSesija: konfiguracija["tajniKljucSesija"] ?? "",
      stranicaLimit: konfiguracija["stranicaLimit"] ?? "",
      tmdbApiKeyV3: konfiguracija["tmdbApiKeyV3"] ?? "",
      email: konfiguracija["email"] ?? "",
      emailPass: konfiguracija["emailPass"] ?? ""
    };

    this.provjeriKonfiguraciju();
  }

  private provjeriKonfiguraciju() {
    if (this.konfiguracija.tajniKljucSesija.trim() == "")
      throw new Error("Fali tajni ključ sesije");

    const broj: number = Number(this.konfiguracija.stranicaLimit);

    if (this.konfiguracija.stranicaLimit.trim() == "" || Number.isNaN(broj))
      throw new Error("Fali broj zapisa po stranici ili nije cijeli broj.");

    if (
      this.konfiguracija.tmdbApiKeyV3 == undefined ||
      this.konfiguracija.tmdbApiKeyV3.trim() == ""
    )
      throw new Error("Fali TMDB API ključ u tmdbApiKeyV3");
  }
}
