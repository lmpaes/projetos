// Ajudantes de DOM do dashboard.
// Regra: texto do usuário SEMPRE entra como texto (textContent / nós de texto),
// nunca como HTML. Por isso não existe nenhum innerHTML aqui.

export interface ElementProps {
  className?: string;
  type?: string;
  /** Atributos extras (ex.: aria-current). Valores undefined são ignorados. */
  attrs?: Record<string, string | undefined>;
  onClick?: (event: MouseEvent) => void;
}

/** Cria um elemento com propriedades e filhos (strings viram nós de texto). */
export function el<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: K,
  props: ElementProps = {},
  ...children: Array<Node | string>
): HTMLElementTagNameMap[K] {
  const element = doc.createElement(tag);
  if (props.className) element.className = props.className;
  if (props.type) element.setAttribute('type', props.type);
  for (const [name, value] of Object.entries(props.attrs ?? {})) {
    if (value !== undefined) element.setAttribute(name, value);
  }
  const onClick = props.onClick;
  if (onClick) element.addEventListener('click', (event) => onClick(event as MouseEvent));
  element.append(...children); // append() transforma strings em nós de TEXTO
  return element;
}

/** Busca um elemento pelo id; se não existir, é bug no HTML (erro claro). */
export function requireElement<T extends HTMLElement>(doc: Document, id: string): T {
  const element = doc.getElementById(id);
  if (!element) throw new Error(`Elemento #${id} não encontrado no HTML do dashboard`);
  return element as T;
}
