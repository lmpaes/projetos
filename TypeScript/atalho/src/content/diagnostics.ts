/** Função que registra um passo da expansão (só escreve algo no modo diagnóstico). */
export type DiagnosticLog = (message: string, details?: Record<string, unknown>) => void;

/** ETAPA 7.1 (TDD): ainda não implementado. */
export function createDiagnosticLog(
  isEnabled: () => boolean,
  output: Pick<Console, 'info'> = console,
): DiagnosticLog {
  void isEnabled;
  void output;
  throw new Error('createDiagnosticLog: não implementado (etapa 7.1)');
}

/** ETAPA 7.1 (TDD): ainda não implementado. */
export function describeElement(element: Element | null): string {
  void element;
  throw new Error('describeElement: não implementado (etapa 7.1)');
}
