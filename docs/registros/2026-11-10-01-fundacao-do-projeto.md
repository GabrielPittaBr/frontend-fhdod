# Fundação do projeto: stack, direção visual, tipos e camada de mock

10/11/2026 · Agente (Claude Code)

> Etapa 1 do plano (Fundação). O trabalho foi pausado duas vezes nesta etapa (uma a pedido, outra pelo limite de uso da ferramenta) e retomado em 11/11. As telas estão no registro seguinte, `2026-11-11-01-telas-pesquisa-painel-tv.md`.

## O que foi feito

- Leitura do plano (`docs/plano-frontend.md`), do Plano de Desenvolvimento, das personas e do enunciado da atividade.
- `package.json` trocado pelo do Vite (`"type": "module"`, scripts `dev`, `build`, `preview`, `lint`, `typecheck`, `test`, `format`), mantendo nome, descrição e campos do repositório. Corrigido o erro de digitação da descrição ("fa Fundação" → "da Fundação").
- Dependências instaladas com pnpm 12 (fixado em `packageManager`): React 19, Vite 8, TypeScript 6, React Router 8, TanStack Query 5, TanStack Table 9, Zustand 5, Tailwind 4, shadcn/ui (estilo radix-nova), React Hook Form 7 + Zod 4, Recharts 3, lucide-react, date-fns 4, qrcode.react 4, Vitest 5, ESLint 10 e Prettier 3.
- Configuração: `tsconfig.json` (modo `strict`, alias `@/`), `vite.config.ts` (React, Tailwind, Vitest), `index.html` (`lang="pt-BR"`, zoom liberado), `components.json`.
- Componentes do shadcn/ui gerados em `src/components/ui/`: alert-dialog, badge, button, checkbox, dialog, dropdown-menu, input, label, select, sheet, skeleton, sonner, switch, table, tabs, textarea, tooltip.
- Logo movido de `assets/img/logo.png` para `src/assets/logo.png`.
- Rostinhos da escala em `src/assets/emojis/` (cinco SVGs coloridos do Microsoft Fluent Emoji).
- Tema em `src/styles/globals.css`: paleta, tipografia, cores da escala, tema escuro da TV, modo totem e `prefers-reduced-motion`.
- Tipos do contrato em `src/lib/api/tipos.ts` e o erro padrão da API em `src/lib/api/erro.ts`.
- Camada de mock em `src/mocks/`:
  - `regras.ts`: classificação (NORMAL, BAIXA, BAIXISSIMA), cálculo do NPS, permissões por perfil e máscara do telefone;
  - `rede.ts`: latência de 200 a 600 ms, falhas forçadas e os erros no formato da API;
  - `banco.ts`: "banco" persistido no `localStorage`, com restauração dos dados iniciais;
  - `auth.ts`: login, refresh, logout, `/auth/me`, troca de senha e os atalhos de demonstração;
  - `pesquisa.ts`: definição da pesquisa, envio com idempotência e complemento com token de uso único;
  - `consultas.ts`: dashboard, respostas, pedidos de retorno, exportação em CSV e indicadores da TV;
  - `cadastros.ts`: setores (409 em slug repetido), categorias, turnos, perguntas (ordem, status, bloqueio da troca de tipo), usuários (senha provisória devolvida uma vez), telas de TV (token devolvido uma vez) e a restauração dos dados iniciais;
  - `seed/dados.ts` e `seed/historico.ts`: setores, categorias, turnos, perguntas, usuários, telas de TV, configurações e cerca de quatro meses de respostas geradas com semente fixa.

## Decisões e por quê

| Decisão | Por quê (persona ou regra) |
| --- | --- |
| Os cinco rostinhos são a identidade do sistema; todo o resto fica discreto | Sônia entende a escala só de olhar. O plano pede que a escala seja reconhecível na pesquisa, no painel e na TV |
| Paleta herdada do material das personas: verde-petróleo `#0A6C6C` para ações, azul-marinho `#12303F` para texto, fundo `#F3F8F7` | Coerência com o material da dupla e visual calmo, adequado a um hospital (seção 13) |
| **Vermelho da marca só no logo.** Ações usam verde-petróleo; avisos usam âmbar (`#6E4400` sobre `#FFF1CC`); erros de formulário usam ferrugem (`#A63D00`); as cores vermelho→verde aparecem só na escala e nos indicadores que a repetem | Resolve o ponto da seção 13: o vermelho deixa de ser lido como erro e não se confunde com o "Muito ruim" |
| Cores da escala: 1 `#D9483B`, 2 `#E9853A`, 3 `#E2B32C`, 4 `#8BBB3C`, 5 `#2FA05C`, usadas como fundo claro com texto azul-marinho | Contraste do texto sobre os fundos entre 8,6:1 e 12,3:1 (AA). A informação nunca depende só da cor: rosto + texto + cor |
| Tipografia Atkinson Hyperlegible Next (variável, um arquivo leve), com fontes do sistema como reserva | Fonte criada pelo Braille Institute para baixa visão. Dor da Sônia: "letra pequena". Seção 14 permite "uma fonte leve" |
| Rostinhos: Microsoft Fluent Emoji, estilo Color em SVG (5 a 7 KB cada). 1 Disappointed face, 2 Slightly frowning face, 3 Neutral face, 4 Slightly smiling face, 5 Grinning face with smiling eyes | Mesma família das personas, licença MIT, iguais em qualquer aparelho. A sequência é simétrica: tristeza sem raiva nem choro (medo da Sônia de "prejudicar um atendimento futuro") |
| Texto em azul-marinho e bordas de campos com contraste mínimo de 3:1; todos os pares de texto conferidos por script (de 5,2:1 a 13,8:1) | Contraste AA em todo o sistema (seção 12) |
| TypeScript 6.0 em vez do 7.0 | O `typescript-eslint` ainda exige `typescript < 6.1`; com o 7, o `pnpm lint` não rodaria |
| Histórico do mock recalculado a cada carga, com semente fixa por dia; só os cadastros e as respostas novas vão para o `localStorage` | Os números não mudam entre cargas (seção 5), o período recente sempre tem dados na demonstração e o `localStorage` não enche |
| Abas se sincronizam pelo evento `storage` | A pesquisa respondida numa aba aparece no dashboard e na TV abertos em outra (exigência da atividade) |
| Falhas forçadas: `?falha=tudo` (toda chamada falha), `?falha=envio` (o primeiro envio é gravado, mas a confirmação "se perde") e navegador offline | Permite testar as telas de erro, o reenvio sem duplicar e a TV sem rede (seções 5 e 10) |
| Respostas de SIM_NAO, MULTIPLA_ESCOLHA e TEXTO vão em `valorTexto`; só a escala usa `valorNumero` | O contrato limita `valor_numero` a 1–5 e não diz como gravar os outros tipos |
| Internação tem 9 perguntas ativas; o Pronto Atendimento tem 6 | A Internação mostra o aviso de mais de 8 perguntas; o setor da demonstração fica curto (Sônia e Camila: gastar pouco tempo) |
| Perguntas concretas ("Como foi a primeira avaliação, quando perguntaram o que você sentia?") | Dor da Sônia: perguntas abstratas |
| Evitados `Map.groupBy` e `structuredClone` no código que roda no navegador | Totens e TVs costumam ter navegadores antigos |

## Ferramentas e skills usadas

- Plugin **frontend-design**: plano de design (paleta, tipografia, layout, princípios) antes de qualquer tela.
- **Taste skill** (`design-taste-frontend`): lidas as referências de texto, formulários, acessibilidade e microinterações. O que é de landing page (hero, fotos, shaders, o "gate" de publicação) foi ignorado, como manda o plano.
- CLI do shadcn/ui para gerar os componentes.
- Script de contraste WCAG para validar a paleta.
- Ainda não usadas: **web-design-guidelines** (revisão ao fim de cada área) e a checagem da taste skill no navegador.

## O que mudou em relação ao plano

- **pnpm via Corepack.** O pnpm não está instalado na máquina; foi usado `corepack pnpm` e a versão ficou fixada em `packageManager`.
- **Turnos não são desativados.** O plano do front cita "desativar" turnos, mas o contrato (`PATCH /turnos/:id`) só edita nome e horários e a tabela não tem a coluna `ativo`. Vale o Plano de Desenvolvimento.
- **`temRespostas` na pergunta.** Campo de leitura a mais no tipo `Pergunta`, para o painel bloquear a troca de tipo já explicando o motivo. Não existe no contrato: combinar com a API.
- **Definição pública da pesquisa sem os limites de nota.** O contrato cita "limites"; o mock devolve só o que a tela usa (limite de caracteres e tempos do totem), porque o front não pode recalcular a classificação.
## Pendências e dúvidas

As decisões que este registro deixou "para as próximas telas" foram implementadas e estão justificadas no registro de 11/11. Uma mudou no caminho: a fonte Atkinson Hyperlegible Next foi trocada pela Lexend (o porquê está lá).

### Pontos em aberto do plano (valores provisórios no mock)

- Horários dos turnos: Manhã 07h–13h, Tarde 13h–19h, Noite 19h–07h.
- Texto do NPS: o da tabela de configurações do Plano de Desenvolvimento.
- Quem vê telefones: Ouvidoria e Super Admin.
- Limite de dias em "Outra data": ainda sem limite, só bloqueio de data futura.
- Paciente ou acompanhante: não implementado, como manda o plano.

### Limitações conhecidas

- A persistência do mock vale só dentro do mesmo navegador: uma pesquisa respondida no celular não aparece no painel aberto no computador.
