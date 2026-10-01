import type { SnippetError } from './errors';
import type { Value } from './values';

/**
 * O que uma variável guarda: um valor, ou o erro que aconteceu ao calculá-la.
 *
 * Guardar o erro (em vez de mostrar na hora) permite isto:
 *   {id=extractregex({site: text; selector=#x}, "\d+")}  ← pode falhar
 *   {=catch(id, "sem id")}                               ← o catch trata
 */
export type Binding = { ok: true; value: Value } | { ok: false; error: SnippetError };

/** Variáveis de UMA renderização do snippet (começa vazio a cada expansão). */
export class Scope {
  private readonly bindings = new Map<string, Binding>();

  setValue(name: string, value: Value): void {
    this.bindings.set(name, { ok: true, value });
  }

  setError(name: string, error: SnippetError): void {
    this.bindings.set(name, { ok: false, error });
  }

  get(name: string): Binding | undefined {
    return this.bindings.get(name);
  }
}
