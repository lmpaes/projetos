/** ETAPA 4 (TDD): ainda não implementado. */
export function readClipboard(nav: Pick<Navigator, 'clipboard'> = navigator): Promise<string> {
  void nav;
  return Promise.reject(new Error('readClipboard: não implementado (etapa 4)'));
}
