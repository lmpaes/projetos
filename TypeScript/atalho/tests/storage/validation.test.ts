// Especificação: regras para salvar um snippet.
import { describe, expect, it } from 'vitest';
import { validateSnippet } from '@/storage/validation';
import { input, snippet } from './fixtures';

const fields = (issues: Array<{ field: string }>) => issues.map((issue) => issue.field);

describe('validateSnippet — campos', () => {
  it('snippet válido não tem erros nem avisos', () => {
    expect(validateSnippet(input(), [])).toEqual({ errors: [], warnings: [] });
  });

  it('nome é obrigatório (espaços não contam)', () => {
    expect(fields(validateSnippet(input({ name: '   ' }), []).errors)).toEqual(['name']);
  });

  it('nome tem limite de tamanho', () => {
    expect(fields(validateSnippet(input({ name: 'x'.repeat(101) }), []).errors)).toEqual(['name']);
  });

  it('atalho é obrigatório', () => {
    expect(fields(validateSnippet(input({ shortcut: '' }), []).errors)).toEqual(['shortcut']);
  });

  it('atalho não pode ter espaços', () => {
    const { errors } = validateSnippet(input({ shortcut: '/minha sig' }), []);
    expect(errors).toEqual([{ field: 'shortcut', message: expect.stringContaining('espaços') as unknown }]);
  });

  it('atalho precisa de pelo menos 2 caracteres (1 letra dispararia o tempo todo)', () => {
    const { errors } = validateSnippet(input({ shortcut: 'a' }), []);
    expect(errors[0]?.message).toContain('pelo menos 2');
  });

  it('atalho tem no máximo 50 caracteres', () => {
    const { errors } = validateSnippet(input({ shortcut: '/' + 'x'.repeat(50) }), []);
    expect(errors[0]?.message).toContain('no máximo 50');
  });

  it('espaços nas pontas do atalho e do nome são ignorados', () => {
    expect(validateSnippet(input({ name: ' Assinatura ', shortcut: ' /sig ' }), [])).toEqual({
      errors: [],
      warnings: [],
    });
  });

  it('conteúdo vazio não é aceito', () => {
    const { errors } = validateSnippet(input({ content: '' }), []);
    expect(errors).toEqual([{ field: 'content', message: expect.stringContaining('vazio') as unknown }]);
  });

  it('vários problemas ao mesmo tempo', () => {
    expect(fields(validateSnippet({ name: '', shortcut: '', content: '' }, []).errors)).toEqual([
      'name',
      'shortcut',
      'content',
    ]);
  });
});

describe('validateSnippet — atalho duplicado', () => {
  const existing = [snippet({ id: 'a', name: 'Assinatura', shortcut: '/sig' })];

  it('atalho já usado por outro snippet é erro (com o nome do outro)', () => {
    const { errors } = validateSnippet(input({ name: 'Nova', shortcut: '/sig' }), existing);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.field).toBe('shortcut');
    expect(errors[0]?.message).toContain('Já existe');
    expect(errors[0]?.message).toContain('Assinatura');
  });

  it('editar o próprio snippet mantendo o atalho não é duplicado', () => {
    expect(validateSnippet(input({ shortcut: '/sig' }), existing, 'a').errors).toEqual([]);
  });

  it('maiúsculas diferentes são atalhos diferentes', () => {
    expect(validateSnippet(input({ shortcut: '/SIG' }), existing).errors).toEqual([]);
  });

  it('compara já sem os espaços das pontas', () => {
    expect(validateSnippet(input({ shortcut: ' /sig ' }), existing).errors).toHaveLength(1);
  });
});

describe('validateSnippet — conflito de prefixo (aviso, não bloqueia)', () => {
  // A expansão acontece assim que o texto antes do cursor termina com um atalho.
  // Se já existe "/s", ao digitar "/sig" o "/s" dispara antes de você terminar.

  it('novo "/sig" com um "/s" existente: avisa que o /s vai disparar antes', () => {
    const { errors, warnings } = validateSnippet(input({ shortcut: '/sig' }), [
      snippet({ name: 'Saudação', shortcut: '/s' }),
    ]);
    expect(errors).toEqual([]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.message).toContain('/s');
    expect(warnings[0]?.message).toContain('Saudação');
  });

  it('novo "/s" com um "/sig" existente: avisa que vai atrapalhar o /sig', () => {
    const { warnings } = validateSnippet(input({ shortcut: '/s' }), [
      snippet({ name: 'Assinatura', shortcut: '/sig' }),
    ]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.message).toContain('/sig');
  });

  it('"/sig" e "/sig2" também conflitam', () => {
    expect(validateSnippet(input({ shortcut: '/sig2' }), [snippet({ shortcut: '/sig' })]).warnings).toHaveLength(1);
  });

  it('atalho no meio de outro, depois de um separador, conflita ("dt" dentro de "-dtx")', () => {
    // Ao digitar "-dt", o "dt" vem depois de "-" (separador) e dispara.
    expect(validateSnippet(input({ shortcut: 'dt' }), [snippet({ shortcut: '-dtx' })]).warnings).toHaveLength(1);
    expect(validateSnippet(input({ shortcut: '-dtx' }), [snippet({ shortcut: 'dt' })]).warnings).toHaveLength(1);
  });

  it('atalho no meio de outro, mas colado, NÃO conflita ("si" dentro de "/sig")', () => {
    // Regra do separador: em "/si", o "si" está colado na "/" e não dispara.
    expect(validateSnippet(input({ shortcut: 'si' }), [snippet({ shortcut: '/sig' })]).warnings).toEqual([]);
    expect(validateSnippet(input({ shortcut: '/sig' }), [snippet({ shortcut: 'si' })]).warnings).toEqual([]);
  });

  it('terminar igual não é conflito ("ig" e "/sig": o mais longo vence)', () => {
    expect(validateSnippet(input({ shortcut: 'ig' }), [snippet({ shortcut: '/sig' })]).warnings).toEqual([]);
  });

  it('atalhos sem relação não geram aviso', () => {
    expect(validateSnippet(input({ shortcut: '/end' }), [snippet({ shortcut: '/sig' })]).warnings).toEqual([]);
  });

  it('não compara o snippet com ele mesmo', () => {
    expect(validateSnippet(input({ shortcut: '/sig' }), [snippet({ id: 'a', shortcut: '/s' })], 'a').warnings).toEqual(
      [],
    );
  });
});
