import nodemailer from "nodemailer";
import { Konfiguracija } from "../zajednicko/konfiguracija";

export async function posaljiMail(
	salje: string,
	prima: string,
	predmet: string,
	poruka: string,
	konf: Konfiguracija
) {
	let message = {
		from: salje,
		to: prima,
		subject: predmet,
		text: poruka,
	};

	let mailer = nodemailer.createTransport({
		host: "smtp.gmail.com",
		port: 587,
		auth: {
			user: konf.dajKonfiguraciju().email,
			pass: konf.dajKonfiguraciju().emailPass,
		},
	});

	let odgovor = await mailer.sendMail(message);
	console.log(odgovor);
	return odgovor;
}
