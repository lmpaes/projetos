export type Debounced<A extends unknown[]> = ((...args: A) => void) & { cancel(): void };

/** ETAPA 7 (TDD): ainda não implementado. */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, delayMs: number): Debounced<A> {
  void fn;
  void delayMs;
  throw new Error('debounce: não implementado (etapa 7)');
}
