export function parsirajDatum(datRod: string | null) : string | null{
    if(!datRod || datRod.trim() == "") return null;

    const [dan, mjesec, godina] = datRod.split(".");

    return `${godina}-${mjesec}-${dan}`;
}
