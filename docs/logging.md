# Logs de servidor

Referência do logging server-side do frontend. **Log é em inglês; mensagem de
usuário é em pt-BR.** As duas coisas não se misturam: `MESSAGES`
(`src/lib/api/errors.ts`) é o que o usuário lê; o log é pra quem opera.

## Como usar

```ts
import { createLogger } from "@/lib/logger";

const log = createLogger("api");

log.warn("request_rejected", { method: "POST", path: "/auth/login", status: 400 });
```

`src/lib/logger.ts` é `server-only`. Não dá pra importar em Client Component —
de propósito: o contexto dos logs carrega dados (URL do backend, corpo de
resposta) que o browser nunca deve ver.

## Formato

Toda entrada tem `timestamp`, `level`, `scope`, `event` e o contexto achatado no
mesmo objeto.

Em produção sai uma linha JSON por evento, pronta pra ingestão:

```json
{"timestamp":"2026-08-13T12:00:00.000Z","level":"error","scope":"api","event":"upstream_error","method":"POST","path":"/auth/login","status":503,"durationMs":142}
```

Em dev sai o mesmo contexto como JSON indentado, truncado em 4.000 caracteres:
`ERROR [api] upstream_error {"method": "POST", ...}`. É string (não objeto)
porque o overlay do Next não reconstrói objetos encaminhados do servidor e
renderizaria `{}`.

## Convenções

- **`scope`** — o subsistema, em uma palavra: `api`, `auth`. Um `createLogger`
  por módulo, no topo do arquivo.
- **`event`** — `snake_case`, no passado, descrevendo **o que aconteceu**, não a
  mensagem que o usuário vai ver. Nunca interpolar valores no nome do evento:
  eles vão no contexto, senão o evento deixa de ser agrupável.
- **contexto** — chaves em `camelCase`. Prefira nomes estáveis entre eventos:
  `method`, `path`, `status`, `durationMs`, `reason`, `error`.
- **`reason`** — quando um evento tem mais de uma causa, o motivo é um valor
  fechado (`"timeout"`, `"expired_token"`), não texto livre.

## Níveis

| nível | quando |
|---|---|
| `error` | quebrou e alguém precisa olhar: backend fora, 5xx, resposta fora do contrato |
| `warn` | anômalo mas tratado: status inesperado, cookie de sessão corrompido |
| `info` | marco relevante em produção |
| `debug` | fluxo normal e resultados esperados — sessão expirada, 401 de login errado |

Um 401 de senha errada é o sistema funcionando: vai em `debug`, não em `warn`.
Se todo caminho de erro virasse `error`, ninguém olharia mais o log.

O **422 é a exceção entre os 4xx**: vai em `warn`. As validações do formulário
são as mesmas do backend, então o usuário não consegue produzir um 422 pela UI —
ver [`../api-contract.md`](../api-contract.md#por-que-o-422-não-é-tratado-campo-a-campo).
Um 422 significa request por fora do formulário, ou as duas listas de validação
tendo divergido. Nos dois casos alguém precisa olhar.

O nível mínimo vem de `LOG_LEVEL`; sem ele, `debug` em dev e `info` em produção.

## Redação

O logger apaga automaticamente qualquer chave que case com
`token|password|secret|authorization|cookie|api_key`, em qualquer profundidade,
trocando o valor por `[redacted]`. É isso que torna seguro logar o corpo inteiro
de uma resposta — o `token` de `/auth/login` não vaza pro stdout.

A redação é por **nome de chave**. Um campo sensível com nome fora desse padrão
passa direto: ao criar um, ou nomeie de acordo, ou não o coloque no contexto.

`Error` é serializado como `{ name, message, stack }` — passe a exceção crua em
`error`, não `String(cause)`.

## Onde o log acontece

O log fica onde existe contexto e causa, uma vez só por evento:

- **`src/lib/api/client.ts`** loga toda requisição. `errors.ts` só mapeia status
  pra mensagem — é função pura, não loga.
- **`src/lib/api/session.ts`** loga a rejeição do cookie de sessão, porque é lá
  que se sabe se o token era indecodificável ou se já tinha expirado. Quem chama
  (`actions.ts`) só recebe `false` e não loga de novo.

## Catálogo

### `api`

| evento | nível | contexto |
|---|---|---|
| `request_completed` | debug | `method`, `path`, `status`, `durationMs` |
| `request_failed` | error | + `reason: "timeout" \| "unreachable"`, `error` |
| `request_rejected` | debug (401/409) · warn (demais 4xx) | + `body` |
| `upstream_error` | error | + `body` — status ≥ 500 |
| `response_contract_violation` | error | + `body`, `issues` — 2xx fora do schema |

### `auth`

| evento | nível | contexto |
|---|---|---|
| `session_cookie_rejected` | error | `reason: "undecodable_token" \| "expired_token"` |
| `session_cookie_malformed` | warn | `reason: "invalid_json" \| "schema_mismatch"` |
| `session_ended` | debug | `reason: "undecodable_token" \| "expired_token"` |

`session_cookie_rejected` é `error`: o backend acabou de autenticar e devolveu um
token que não dá pra usar. `session_cookie_malformed` é `warn` — cookie velho ou
adulterado no browser, fora do nosso controle.

## Client Components

`src/app/error.tsx` roda no browser e não pode importar o logger — ele é
`server-only`. Usa `console.error` direto, imitando o formato à mão:

```ts
console.error("[app] render_error", { digest: error.digest, error });
```

O `digest` é um hash que o Next gera pro erro e repete no log do servidor: é o
que liga um erro relatado pelo usuário à linha correspondente do backend. Em
produção o `error.message` de Server Component vem genérico de propósito, pra não
vazar detalhe interno pro cliente — o `digest` é a única correlação que sobra.

Ele não vai pra tela: `docs/design/04-ux.md` fecha a questão — "código de erro e
stack vão para `console.error`, nunca para a tela".
