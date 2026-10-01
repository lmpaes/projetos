// Preparação do ambiente de testes (roda antes de cada arquivo de teste).
//
// O jsdom não tem DataTransfer (o Chrome tem). O Atalho usa DataTransfer para
// a "colagem sintética" nos editores ricos, então aqui criamos uma versão
// mínima, só com o que o código usa: setData/getData/types.
if (typeof globalThis.DataTransfer === 'undefined') {
  class MinimalDataTransfer {
    private readonly data = new Map<string, string>();
    setData(format: string, value: string): void {
      this.data.set(format, value);
    }
    getData(format: string): string {
      return this.data.get(format) ?? '';
    }
    get types(): string[] {
      return [...this.data.keys()];
    }
  }
  Object.defineProperty(globalThis, 'DataTransfer', { value: MinimalDataTransfer, configurable: true });
}
