# Atalho — expansor de snippets para Chrome

Extensão Chrome (Manifest V3 + TypeScript) que troca um atalho digitado (ex.: `/sig`) pelo texto de
um snippet. É um projeto de estudo inspirado no Text Blaze.

> 🚧 **Em construção (Fase 1).** As instruções completas de instalação, uso e exemplos de cada
> comando chegam na etapa final.

## Como baixar a extensão pronta (sem instalar Node)
1. No GitHub, abra a aba **Actions** → workflow **"Atalho (extensão Chrome)"** → a execução mais recente com ✅.
2. Em **Artifacts**, baixe `atalho-chrome-mv3` (vem como .zip) e extraia.
3. No Chrome, abra `chrome://extensions`, ligue o **Modo do desenvolvedor** e clique em
   **Carregar sem compactação**. Escolha a pasta extraída (a que contém `manifest.json`).

## Desenvolvimento (opcional, com Node 22+)
```bash
npm install
npm run lint && npm test && npm run build
```
