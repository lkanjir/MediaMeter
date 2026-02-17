interface IValidacija{
    kljuc: string,
    vrijednost: unknown,
    validator: (kljuc: string, vrijednost: unknown) => string | null | Promise<string | null>
}