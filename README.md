# MediaMeter - Legacy

> [!WARNING]
> **LEGACY VERZIJA**
> 
> Ovaj repozitorij sadrži kod web aplikacije razvijene u sklopu kolegija Razvoj web aplikacija.
> U tijeku je **potpuni rewrite**.
> 
> Nova verzija će sadržavati poboljšanja u područjima dizajna backenda i frontenda te  UI/UX-a. 
>
> Novi repozitorij: [MediaMeter](https://github.com/lkanjir/MediaMeter)

![Status](https://img.shields.io/badge/status-legacy-orange)
![Rewrite](https://img.shields.io/badge/rewrite-in%20progress-blue)

## Tehnologije
- Angular
- Express

## Pokretanje
### Preduvjeti

- Node.js 20+
- npm

### Koraci

1. Postavljanje konfiguracije backenda:

```bash
cp posluzitelj/podaci/konfiguracija.template.csv posluzitelj/podaci/konfiguracija.csv
```

Zatim je u `posluzitelj/podaci/konfiguracija.csv` potrebno upisati stvarne vrijednosti za:
- `tajniKljucSesija`
- `stranicaLimit`
- `tmdbApiKeyV3`
- `email`
- `emailPass`

2. Pokretanje kompajlirane verzije (iz direktorija `posluzitelj`):

```bash
npm run pripremi
npm install
npm run zadaca
```
### Opcionalno:

Ako želite kompajlirati backend ili frontend ili ste radili promjene slijedite upute u nastavku.

3. Instalacija backend paketa (iz direktorija `posluzitelj`):

```bash
npm run pripremi
npm install
```

4. Pokretanje backenda:

```bash
npm run start-local
```

Backend se pokreće na `http://localhost:12222`.
Backend sadrži kompajliranu verziju Angular frontenda.

5. Instalacija frontend paketa (dok je backend pokrenut, iz roota projekta):

```bash
cd angular
npm install
```

6. Pokretanje frontenda:

```bash
ng serve
```

Frontend se pokreće na `http://localhost:4200` (API pozivi idu preko proxyja na backend port `12222`).

## Funkcionalnosti

### Svi korisnici
- Prijava (korištenje sesije)
- Registracija uz aktivaciju računa putem e-maila
- Pregledavanje sadržaja javnih kolekcija

<img width="1168" height="893" alt="image" src="https://github.com/user-attachments/assets/e2641818-3e15-4662-bd10-d648b0d17f89" />
<img width="1183" height="1538" alt="image" src="https://github.com/user-attachments/assets/e5cc2296-478f-4abc-ba7b-cc80b71d01f4" />

### Prijavljeni korisnici
- Pretraživanje multimedijskog sadržaja po nazivu (u svim javnim kolekcijama)
- Filtriranje sadržaja po autoru i datumu
- Pretraživanje filmova s TMDB-a po naslovu
- Dodavanje filmova u kolekciju
- Pregled i uređivanje vlastitih kolekcija

<img width="1151" height="957" alt="image" src="https://github.com/user-attachments/assets/8209fc78-836a-4015-a20d-1f9275273dae" />
<img width="1151" height="957" alt="image" src="https://github.com/user-attachments/assets/b1348dfd-044d-4462-8489-f8db6382e484" />
<img width="1200" height="994" alt="image" src="https://github.com/user-attachments/assets/aa142399-785f-4db0-949e-4c57c481fe9f" />
<img width="1019" height="2098" alt="image" src="https://github.com/user-attachments/assets/dcb59e0d-8ffa-48ba-957a-31ead43760f2" />

### Moderator

- Upravljanje kolekcijama i dodavanje članova u kolekcije 

<img width="1074" height="400" alt="image" src="https://github.com/user-attachments/assets/fa9e9ff2-2118-4cae-b4d1-e7a6f841db1a" />
<img width="1088" height="1429" alt="image" src="https://github.com/user-attachments/assets/0f20a435-5114-4b3d-8a45-0e935c188091" />

### Administrator

- Promjena uloge korisnika u moderatora i obrnuto
- Blokiranje / odblokiranje korisničkih računa


