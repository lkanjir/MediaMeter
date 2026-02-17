import { RequestHandler } from "express";
import { RWASesija } from "../sucelja/servisi/IKorisnik.js";
import { dajPravoZaTipKorisnika } from "../zajednicko/prava.js";

const jePirjavljen = (sesija?: RWASesija) => {
	return sesija?.korime != null && sesija?.tipKorisnikaId != null;
};

export function potrebnaPrava(potrebnaRazina: number): RequestHandler {
	return (zahtjev, odgovor, slijedeciMiddleware) => {
		const sesija = zahtjev.session as RWASesija | undefined;

		const jeApi = zahtjev.path.startsWith("/api");
		const posaljiGresku = (status: number, tekst: string) => {
			if (jeApi) odgovor.status(status).json({ greska: tekst });
			else if (sesija) {
				sesija.greskaTekst = tekst;
				odgovor.redirect("/greska");
			} else odgovor.redirect(`/greska?tekst=${encodeURIComponent(tekst)}`);
		};

		if (!jePirjavljen(sesija)) {
			posaljiGresku(401, "potrebna prijava");
			return;
		}

		const razinaKorisnika = dajPravoZaTipKorisnika(sesija?.tipKorisnikaId);
		if (razinaKorisnika < potrebnaRazina) {
			posaljiGresku(403, "zabranjen pristup");
			return;
		}

		slijedeciMiddleware();
	};
}

//TODO ovo moze bolje ali za sad dobro
export const Prava = {
	get registrirani() {
		return dajPravoZaTipKorisnika(1);
	},
	get moderator() {
		return dajPravoZaTipKorisnika(2);
	},
	get admin() {
		return dajPravoZaTipKorisnika(3);
	},
};
