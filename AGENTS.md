<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:design-system-rules -->
# UI

**Antes de editar `src/app/**`, `src/components/**` ou `src/app/globals.css`,
leia [`docs/design/README.md`](docs/design/README.md).**

O design system é um preset do shadcn (`b1VlIttI`). Trocar o preset reconfigura o
projeto inteiro, inclusive reescrevendo os componentes instalados. Todo valor
escrito à mão é um valor que a troca de preset não atualiza.

Regras inegociáveis — detalhe e exemplos em
[`docs/design/03-regras.md`](docs/design/03-regras.md):

1. Cor só por token semântico. Nada de paleta crua do Tailwind, hex, `white`/`black`.
2. Sem raio, fonte ou tamanho arbitrário `[...]`.
3. Não editar o interior de `src/components/ui/**`.
4. Ícones só via `@/components/icons`.
5. Usar o componente shadcn existente antes de criar um novo.
6. Rodar a CLI com `--dry-run`/`--diff`/`--view` antes de escrever.

Toda decisão visual precisa ser válida em light e dark.

## Antes de concluir uma tarefa de UI

- [ ] Rodei as verificações de [`docs/design/README.md`](docs/design/README.md#verificação) — todas limpas
- [ ] `npx tsc --noEmit && npm run build` passam
- [ ] Pares `bg-*` / `text-*-foreground` corretos, testado nos dois temas
- [ ] Uma única ação primária na tela
- [ ] Estados de loading, vazio e erro cobertos ou justificados
- [ ] Texto visível em pt-BR; código em inglês
- [ ] Ícone sem texto tem `aria-label`
- [ ] Token novo (se houver): em `:root` e `.dark`, exposto em `@theme inline`, contraste medido

API de componente: `npx shadcn@latest docs <nome>`.
<!-- END:design-system-rules -->
