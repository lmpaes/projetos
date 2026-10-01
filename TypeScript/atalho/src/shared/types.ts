/** Um snippet salvo pelo usuário. */
export interface Snippet {
  /** Identificador único (crypto.randomUUID()). */
  id: string;
  /** Nome para o usuário se achar no dashboard, ex.: "Assinatura". */
  name: string;
  /** O que o usuário digita para expandir, ex.: "/sig". */
  shortcut: string;
  /** Texto do snippet, com comandos como {site: url}. */
  content: string;
  /** Datas em milissegundos (Date.now()). */
  createdAt: number;
  updatedAt: number;
}

/** O que o usuário preenche no formulário (o resto a extensão calcula). */
export type SnippetInput = Pick<Snippet, 'name' | 'shortcut' | 'content'>;
