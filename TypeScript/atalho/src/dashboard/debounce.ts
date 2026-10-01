export type Debounced<A extends unknown[]> = ((...args: A) => void) & { cancel(): void };

/**
 * Espera `delayMs` sem novas chamadas antes de executar `fn`.
 * Usado no preview: enquanto você digita, ele não recalcula a cada tecla.
 */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, delayMs: number): Debounced<A> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}
