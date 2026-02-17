import { HttpErrorResponse } from '@angular/common/http';

export function mapirajGresku(
  greska: unknown,
  osnovnaVrijednost: string
): string {
  if (greska instanceof HttpErrorResponse) {
    const poruka = (greska.error as { greska?: string } | null)?.greska;
    if (poruka) return poruka;
  }

  return osnovnaVrijednost;
}
