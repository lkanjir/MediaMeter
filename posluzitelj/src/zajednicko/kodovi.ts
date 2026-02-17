import crypto from "crypto";

export function kreirajSol(): string {
	return crypto.randomBytes(16).toString("hex");
}

export function kreirajSHA256(tekst: string, sol: string) {
	const hash = crypto.createHash("sha256");
	hash.write(tekst + sol);
	var izlaz = hash.digest("hex");
	hash.end();
	return izlaz;
}

export function hexToUint8Array(hex: string): Uint8Array {
	const byteLength = hex.length / 2;
	const uint8Array = new Uint8Array(byteLength);

	for (let i = 0; i < byteLength; i++) {
		uint8Array[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}

	return uint8Array;
}

export function dajNasumceBroj(min: number, max: number) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min);
}

export function dajAktivacijskiKod() {
	return crypto.randomBytes(24).toString("hex");
}
