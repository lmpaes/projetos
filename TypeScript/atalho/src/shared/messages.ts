// =============================================================================
// Mensagens trocadas entre as partes da extensão (chrome.runtime.sendMessage).
// -----------------------------------------------------------------------------
// Toda mensagem enviada por runtime.sendMessage chega a TODAS as páginas da
// extensão (background, offscreen...). O campo `target` diz para quem ela é;
// cada parte ignora o que não for para ela.
// =============================================================================

export type MessageTarget = 'background' | 'offscreen';

export interface ReadClipboardRequest {
  target: MessageTarget;
  type: 'read-clipboard';
}

export type ReadClipboardResponse = { ok: true; text: string } | { ok: false; error: string };

/** A mensagem recebida é um pedido de leitura do clipboard para `target`? */
export function isReadClipboardRequest(
  message: unknown,
  target: MessageTarget,
): message is ReadClipboardRequest {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as Partial<ReadClipboardRequest>).target === target &&
    (message as Partial<ReadClipboardRequest>).type === 'read-clipboard'
  );
}

/** A resposta recebida tem o formato esperado? (mensagens chegam como `unknown`) */
export function isReadClipboardResponse(value: unknown): value is ReadClipboardResponse {
  if (typeof value !== 'object' || value === null) return false;
  const response = value as Record<string, unknown>;
  return response.ok === true
    ? typeof response.text === 'string'
    : response.ok === false && typeof response.error === 'string';
}
