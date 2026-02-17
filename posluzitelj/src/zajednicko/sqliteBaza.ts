import sqlite3 from "sqlite3";
import { Database, open } from "sqlite";

export default class Baza {
	private db?: Database<sqlite3.Database, sqlite3.Statement>;

	constructor(private readonly putanja: string) {}

	async spoji() {
		this.db = await open({
			filename: this.putanja,
			driver: sqlite3.Database,
		});
		await this.db.exec("PRAGMA foreign_keys = ON;");
	}

	dajSve<T>(sql: string, parametri: Array<unknown> = []): Promise<Array<T>> {
		return this.db!.all<Array<T>>(sql, parametri);
	}

	dajJedan<T>(
		sql: string,
		parametri: Array<unknown> = []
	): Promise<T | undefined> {
		return this.db!.get<T>(sql, parametri);
	}

	izvrsi(sql: string, parametri: Array<unknown> = []): Promise<void> {
		return this.db!.run(sql, parametri).then(() => {});
	}

	async zatvoriVezu() {
		await this.db?.close();
	}
}
