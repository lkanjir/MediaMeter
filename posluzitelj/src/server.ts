import cors from "cors";
import express, { Application } from "express";
import { dajPort } from "./zajednicko/esmPomocnik.js";
import { Konfiguracija } from "./zajednicko/konfiguracija.js";
import {
	pripremiPutanjeResursTMDB,
	pripremiPutanjeResursKorisnika,
	pripremiPutanjeResursaSpolova,
	pripremiDirektorijMultimedije,
	PripremiPutanjeResursaKolekcija,
	pripremiPutanjeResursFilmova,
	pripremiPutanjeResursaKorisnickogSadrzaja,
} from "./servis/servis.js";

import sesija from "express-session";
import kolacici from "cookie-parser";
import { pripremiUloge } from "./zajednicko/prava.js";

import * as putanja from "path";
import { Request, Response } from "express";

main(process.argv);

async function main(argv: Array<string>) {
	let port: number = dajPort("lkanjir23");
	if (argv[3] != undefined) {
		port = parseInt(argv[3]);
	}

	let konf: Konfiguracija | null = null;
	try {
		konf = await inicjalizirajKonfiguraciju();
	} catch (greska: Error | any) {
		if (process.argv.length == 2)
			console.error("Potrebno je dati naziv datoteke");
		else if (greska.path != undefined)
			console.error("Nije moguće otvoriti datoteku: " + greska.path);
		else console.log(greska.message);
		process.exit();
	}

	await pripremiUloge();

	const server: Application = express();
	inicjalizirajPostavkeServera(server, konf);
	pripremiPutanjeServera(server, konf, port);
	pripremiDirektorijMultimedije();
	pokreniServer(server, port);
}

async function inicjalizirajKonfiguraciju(): Promise<Konfiguracija> {
	let konf = new Konfiguracija();
	await konf.ucitajKonfiguraciju();
	return konf;
}

function inicjalizirajPostavkeServera(
	server: Application,
	konf: Konfiguracija
) {
	server.use(express.urlencoded({ extended: true }));
	server.use(express.json());
	server.use(
		cors({
			origin: (origin, povratniPoziv) => {
				if (
					!origin ||
					origin.startsWith("http://spider.foi.hr:") ||
					origin.startsWith("http://localhost:")
				) {
					povratniPoziv(null, true);
				} else {
					povratniPoziv(new Error("Nije dozvoljeno zbog CORS"));
				}
			},
			optionsSuccessStatus: 200,
			credentials: true,
		})
	);

	server.use(kolacici());
	server.use(
		sesija({
			secret: konf.dajKonfiguraciju().tajniKljucSesija,
			saveUninitialized: false,
			cookie: {
				maxAge: 1000 * 60 * 60,
				httpOnly: true,
			},
			resave: false,
		})
	);
}

function pripremiPutanjeServera(
	server: Application,
	konf: Konfiguracija,
	port: number
) {
	pripremiPutanjeResursaKorisnickogSadrzaja(server, konf);
	PripremiPutanjeResursaKolekcija(server, konf);
	pripremiPutanjeResursaSpolova(server, konf);
	pripremiPutanjeResursFilmova(server);
	pripremiPutanjeResursKorisnika(server, konf);
	pripremiPutanjeResursTMDB(server, konf);

	server.use(
		"/sadrzaj",
		express.static(putanja.join(process.cwd(), "sadrzaj"))
	);

	server.use(
		"/resursi",
		express.static(putanja.join(process.cwd(), "resursi"))
	);

	server.get("/", (request: Request, response: Response) => {
		response.sendFile(putanja.join(process.cwd(), "angular", "index.html"));
	});

	server.use("/", express.static(putanja.join(process.cwd(), "angular")));

	server.use((zahtjev, odgovor, slijedeciMiddleware) => {
		if (zahtjev.path.startsWith("/api")) {
			odgovor.status(404);
			var poruka = { greska: "nepostojeći resurs" };
			odgovor.send(JSON.stringify(poruka));
			return;
		}
		if (zahtjev.method != "GET") {
			return slijedeciMiddleware();
		}
		if (
			zahtjev.path.startsWith("/resursi") ||
			zahtjev.path.startsWith("/sadrzaj")
		)
			return slijedeciMiddleware();

		return odgovor.sendFile(
			putanja.join(process.cwd(), "angular", "index.html")
		);
	});
}

function pokreniServer(server: Application, port: number) {
	server.listen(port, () => {
		console.log(`Server pokrenut na portu: ${port}`);
	});
}
