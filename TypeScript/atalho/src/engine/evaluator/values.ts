// Valores que uma expressão pode produzir.
// Fase 1: texto ou lista (ex.: {site: text; selector=li; multiple=yes}).
// Fase 2 deve adicionar números, booleanos etc.
export type Value = string | Value[];

/** Separador usado quando uma lista é inserida no texto. */
export const LIST_SEPARATOR = ', ';

/** Converte um valor no texto que vai ser inserido: listas viram "a, b, c". */
export function toText(value: Value): string {
  return typeof value === 'string' ? value : value.map(toText).join(LIST_SEPARATOR);
}
