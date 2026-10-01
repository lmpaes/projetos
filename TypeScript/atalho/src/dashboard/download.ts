/**
 * Oferece um arquivo de texto para download.
 * Cria um link temporário apontando para um "Blob" (arquivo em memória) e
 * clica nele. Não precisa da permissão "downloads" da extensão.
 */
export function downloadText(
  doc: Document,
  filename: string,
  text: string,
  urlApi: Pick<typeof URL, 'createObjectURL' | 'revokeObjectURL'> = URL,
): void {
  const blob = new Blob([text], { type: 'application/json' });
  const url = urlApi.createObjectURL(blob);

  const link = doc.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  doc.body.append(link);
  link.click();
  link.remove();

  // Libera a memória do Blob depois que o navegador começou o download.
  setTimeout(() => urlApi.revokeObjectURL(url), 0);
}
