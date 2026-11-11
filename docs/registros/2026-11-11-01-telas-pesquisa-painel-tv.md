# Telas da pesquisa, do totem, do painel e da TV Wall, com dados simulados

11/11/2026 · Agente (Claude Code)

Continuação de `2026-11-10-01-fundacao-do-projeto.md`. Cobre as etapas 2 a 8 do plano (`docs/plano-frontend.md`, seção 16).

## O que foi feito

### Base do app

- Rotas com carregamento sob demanda (`src/app/router.tsx`): cada área é um arquivo separado no build.
- Sessão do painel só em memória (Zustand). Ao recarregar a página, o "refresh" do mock recupera a sessão; num 401 a chamada renova o token uma vez e repete (`features/auth/api.ts`).
- Guardas de rota por permissão (`src/app/guards.tsx`), página de acesso negado, página 404 e tela de erro inesperado.
- Uma camada `features/<assunto>/api.ts` por assunto. Só esses arquivos importam `src/mocks/`.
- ESLint e Prettier configurados; `vercel.json` e `public/_redirects` para os links diretos funcionarem depois do build em hospedagem estática.

### Pesquisa do paciente (`/s/:setor`)

- Abertura com logo, os cinco rostinhos, o nome do setor em destaque e o aviso de que é anônimo e leva menos de 2 minutos.
- Dia do atendimento ("Hoje" e "Ontem" com o dia da semana escrito, "Outro dia" com o calendário do aparelho, sem datas futuras) e turno com os horários.
- Perguntas do setor, uma por tela: rostinhos, sim/não, múltipla escolha e texto livre com contador de 500 letras.
- Nota de 0 a 10: o toque seleciona, o botão "Enviar avaliação" confirma.
- Complemento: avaliação baixa recebe "Quer contar o que aconteceu?" e depois "Quer que o hospital entre em contato com você?"; avaliação normal recebe "Quer deixar um elogio ou uma sugestão?".
- Agradecimento "Avaliação enviada".
- Estado num `useReducer` dentro de `useFluxoPesquisa`. O redutor é uma função pura (`features/pesquisa/fluxo.ts`) com 15 testes.

### Modo totem (`/totem/:setor`)

- Mesma pesquisa, sem a etapa de data e turno: vale o dia de hoje e o turno do horário atual, inclusive a Noite, que passa da meia-noite.
- Reinício automático em 15 s no agradecimento, com botão "Começar nova avaliação".
- Inatividade: 60 s sem toque abre "Ainda está aí?"; sem resposta em 10 s, volta ao início.
- Tela cheia ao primeiro toque, tela sempre acesa (Screen Wake Lock), sem zoom, sem seleção de texto e sem menu de contexto. Tudo isso só nesta rota.

### Painel da gestão (`/painel`)

- Login com atalhos de demonstração para cada perfil e links diretos para a pesquisa, o totem e a TV.
- Troca de senha obrigatória no primeiro acesso.
- Menu lateral que mostra só o que a pessoa pode acessar; no celular e no tablet vira menu recolhível. Cabeçalho com nome, perfil e setores.
- Dashboard: filtros na URL, NPS com o número de respostas ao lado, composição de detratores, neutros e promotores, NPS por setor clicável, evolução, notas por categoria, melhores e piores pontos, comentários recentes e exportação.
- Respostas: tabela com filtros, ordenação e paginação (TanStack Table v9) e detalhe em painel lateral.
- Pedidos de retorno com telefone mascarado e o botão "Revelar telefone".
- Setores com links e QR Code para imprimir, perguntas do setor, categorias e turnos, usuários e telas de TV.
- Ação "Restaurar dados de demonstração" no menu do Super Admin.

### TV Wall (`/tv#<token>`)

- Tema escuro, números grandes e quatro visões alternando a cada 15 s: visão geral do mês, NPS por setor, evolução e destaques positivos.
- Barra no rodapé mostra qual visão está na tela e quanto falta para a próxima.
- Recarrega a cada 30 s. Sem rede, mantém os últimos números e mostra "Sem conexão. Números das HH:MM".

## Decisões e por quê

### Pesquisa e totem

| Decisão | Por quê (persona ou regra) |
| --- | --- |
| "Voltar" sempre à esquerda e "Pular" sempre à direita, no rodapé de todas as telas | Sônia: medo de "mexer errado". Os botões de apoio nunca mudam de lugar |
| Rostinhos em lista vertical no celular (rosto + texto de 20 px) e em fileira com 560 px ou mais. A medida é a do espaço disponível (container query), não da janela | Sônia e Camila: alvos grandes no celular. A prévia do painel mostra a versão de celular com os mesmos componentes |
| Ao tocar, o rostinho escolhido escurece, ganha contorno e um sinal de "certo", os outros esmaecem, e só depois de 0,45 s a pesquisa avança. Toques nesse intervalo são ignorados | Plano 7: "estado selecionado bem visível antes de avançar"; evita dupla resposta por toque repetido |
| Cada rostinho tem o rótulo completo para leitor de tela ("4, Bom") e o grupo tem o texto da pergunta | Plano 7 e 12 |
| A cada tela, o foco vai para o título da pergunta | Leitor de tela anuncia a pergunta nova; quem usa teclado recomeça do topo |
| Nota de 0 a 10 sem cor de avaliação: a nota escolhida fica verde-petróleo e o envio é um botão separado | Sônia: um toque acidental não envia nada. A cor no NPS era opcional; sem ela, a nota não parece "certa" ou "errada" |
| Legenda "0 = nada provável" e "10 = muito provável" escrita embaixo dos botões | Sônia: sem precisar adivinhar o sentido da escala |
| Data e turno em duas telas, uma pergunta em cada | "Uma pergunta por tela" (Sônia) e data do atendimento separada da data do envio (dor da Camila) |
| Complemento da avaliação baixa em duas telas (comentário, depois telefone) e um só envio no fim. Se a pessoa fechar a página na tela do telefone, o comentário já escrito é enviado mesmo assim | Uma decisão por tela; nada do que a pessoa escreveu se perde |
| Tipo do comentário já marcado como "Reclamação" na avaliação baixa e como "Elogio" na normal, e "Elogio" é sempre o primeiro botão, do mesmo tamanho dos outros | Camila: "espaço para elogio, não só para reclamação". Menos um toque para a maioria |
| Consentimento do telefone nunca marcado de antemão, dizendo que só a Ouvidoria verá o número. Erros aparecem embaixo do campo e o foco vai para o primeiro com problema | Plano 7 (D07) e LGPD |
| Ao enviar, o paciente só percebe que a pergunta seguinte mudou: nada de "nota baixa" ou "NPS" na tela | Plano 7, regras da pesquisa |
| Erros em âmbar com texto e ícone, nunca em vermelho | Decisão de 10/11: o vermelho é da marca e do "Muito ruim" |
| Envio seguro: chave de idempotência gerada no início (com plano B quando `crypto.randomUUID` não existe), trava contra duplo toque, e "Tentar de novo" com tudo o que foi respondido | Plano 7. Testado com `?falha=envio`: a resposta foi gravada uma vez só |
| Totem com tipografia proporcional à tela (`clamp`): em 1080×1920 os botões têm no mínimo 84 px | Plano 8: alvos de toque ainda maiores que no celular |
| A contagem regressiva é anunciada ao leitor de tela uma vez; o número que muda fica só na tela | Plano 12 |
| A cada reinício do totem, a definição da pesquisa é buscada de novo | Se o gestor mudar as perguntas, o totem passa a mostrá-las sem precisar recarregar |
| **Fonte trocada de Atkinson Hyperlegible Next para Lexend** | A Atkinson Next desenha o zero cortado (Ø). Na escala de 0 a 10, a Sônia poderia ler "Ø" como outro símbolo. A Lexend também foi criada para facilitar a leitura, tem zero sem corte, é variável e pesa 39 kB |

### Painel

| Decisão | Por quê (persona ou regra) |
| --- | --- |
| NPS sempre com "em N respostas" ao lado, e aviso quando há menos de 30 respostas | Renata: "notas sem contexto nem tamanho de amostra". O limite de 30 é provisório |
| Explicação curta do NPS embaixo da composição ("percentual de promotores menos o de detratores, vai de −100 a +100") | Plano 12: números explicados |
| Filtros numa só linha acima de tudo, guardados na URL; a exportação usa os mesmos filtros | Renata: "filtros que ficam salvos e exportação com os mesmos filtros" |
| Clicar num setor do gráfico aplica o filtro daquele setor | Atividade: navegar do hospital até o setor e o turno |
| Evolução em dois gráficos alinhados: a linha do NPS e, embaixo, as colunas com o número de respostas, cada um com o seu eixo. Tabela com os mesmos números em "Ver os números em tabela" | Skill de visualização: nunca dois eixos no mesmo gráfico; todo gráfico tem um equivalente em tabela |
| Média por categoria com o rostinho correspondente | Plano 7: a escala reconhecível em todo o sistema |
| Melhores e piores pontos só com 5 notas ou mais | Uma média de 2 notas engana (dor da Renata) |
| Comentários com selo de ícone e texto do mesmo peso para os quatro tipos | Renata: "elogios e reclamações com o mesmo destaque" |
| Dashboard recarrega a cada 60 s e também quando a aba volta ao foco; ao trocar o filtro, os números anteriores ficam esmaecidos em vez de piscar | Plano 9. O recarregar ao voltar para a aba faz a avaliação recém-enviada aparecer na hora da demonstração |
| Respostas: o detalhe abre num painel lateral com o endereço `?resposta=ID`. Os comentários do dashboard e os pedidos de retorno levam direto para ele | Renata: "relatos soltos, sem histórico". Cada relato leva à resposta completa |
| Telefone mascarado (`•••• 0042`) em toda lista e no detalhe. "Revelar telefone" pede confirmação, avisa que a ação fica registrada e grava na auditoria do mock. O número revelado some ao sair da tela | Renata: "risco de acesso indevido aos contatos" e LGPD |
| O gestor entra em "Setores e perguntas" em modo leitura (só os seus setores) para chegar às perguntas e ao QR Code | O plano previa `/painel/setores/:id/perguntas` para o gestor, mas sem caminho até lá |
| QR Code com folha A4 pronta para imprimir: logo, "Como foi o seu atendimento?", nome do setor, QR grande e o endereço escrito | Plano 9. Na impressão sai só a folha |
| Lista de perguntas ordenável por arrastar (mouse) e por botões "subir" e "descer" (toque e teclado), sem biblioteca extra | Plano 9: arrastar sozinho não é acessível |
| Prévia no formato do celular com os mesmos componentes da pesquisa | Plano 9 |
| Mudar o tipo de uma pergunta com respostas fica bloqueado, com a explicação no próprio campo | Plano de Desenvolvimento: o histórico não muda de sentido |
| Aviso, sem bloquear, quando o setor passa de 8 perguntas ativas (a Internação tem 9 de propósito) | Plano 9 |
| Senha provisória e link da TV mostrados uma única vez, com botão de copiar e o aviso de que não aparecem de novo | Plano 9 |
| Ninguém consegue desativar a própria conta; redefinir a senha de alguém pede confirmação | Evita trancar o único Super Admin fora do sistema e encerrar sessões por engano |

### TV Wall

| Decisão | Por quê (persona ou regra) |
| --- | --- |
| Logo sobre uma placa branca | Plano 13: o logo vermelho legível no fundo escuro |
| O mock da TV devolve só números: nada de comentário, reclamação ou telefone | Renata: "tela pública expondo informação". Conferido na tela: nenhum dado pessoal |
| Destaques positivos com o melhor ponto de cada setor (até três setores diferentes) | Com o ranking geral, os três destaques eram do mesmo setor |
| Tipografia proporcional à largura da tela | Plano 10: legível em TV Full HD e 4K |

### Cores dos gráficos

A composição (detratores, neutros, promotores) usa um par quente e frio com cinza no meio, conferido no validador da skill de visualização:

| Tema | Cores | Resultado |
| --- | --- | --- |
| Painel claro | `#c73e32`, `#9fb0b5`, `#0a6c6c` | Separação para daltonismo e para visão normal: passa. Faixa de luminosidade: passa |
| TV escura | `#e2634f`, `#516a72`, `#22a699` | Separação para daltonismo e para visão normal: passa. Faixa de luminosidade: passa |

O validador acusa "croma baixo" no cinza e contraste abaixo de 3:1 contra o fundo. O cinza é o ponto neutro de uma escala divergente e precisa ser cinza; o contraste baixo é compensado porque cada parte tem a porcentagem escrita e a legenda traz os números. O verde-petróleo da marca (`#0a6c6c`) também fica abaixo do croma recomendado, mas se separa bem das outras cores, que é o que a checagem de daltonismo mede.

## Ferramentas e skills usadas

- **frontend-design**: direção visual (registro de 10/11).
- **design-taste-frontend**: princípios de texto, formulários, acessibilidade e microinterações. O que é de landing page foi ignorado, como manda o plano.
- **dataviz**: forma de cada gráfico, regras de marcas e o validador de cores (resultado acima).
- **web-design-guidelines**: revisão da pesquisa, do totem, do login, do layout, do dashboard e da TV. Resultado na seção seguinte.
- Navegador embutido do Claude Code para testar cada fluxo nos tamanhos da seção 11.
- Script de contraste WCAG (registro de 10/11) e `fontkit` para conferir o desenho do zero nas fontes.

### Revisão com web-design-guidelines

Corrigido:

- Botão com `transition: all` (gerado pelo shadcn/ui) passou a listar as propriedades.
- Imagens da TV e da folha do QR Code sem largura e altura.
- `overscroll-behavior: contain` nos diálogos e no painel lateral.
- `name` e `autocomplete` nos campos da pesquisa e do painel.
- `touch-action: manipulation` em botões, links e campos (sem a espera do duplo toque).
- `color-scheme` claro no app e escuro na TV; cor explícita nos `select` nativos.
- `text-balance` nos títulos das páginas.
- Confirmação antes de redefinir a senha de alguém.
- Componentes do shadcn/ui que não eram usados foram apagados (badge, checkbox, select, switch, tabs, tooltip).

Mantido, com o motivo:

- `user-scalable=no` e `maximum-scale=1`: só no totem, como pede o plano (seção 8). Ao sair do totem o valor original volta, e a pesquisa pelo celular mantém o zoom.
- `autoFocus` em dois lugares: no calendário depois que a pessoa toca em "Outro dia" (único campo da tela) e no "Sim, continuar" do aviso de inatividade (o diálogo precisa receber o foco).
- Datas com `date-fns` e o idioma pt-BR, e não `Intl`: a biblioteca está na stack do plano e o formato brasileiro é o único usado.
- Títulos com inicial maiúscula em cada palavra (regra de inglês): em português o padrão é só a primeira palavra.
- Listas sem virtualização: as tabelas paginam de 20 em 20 e as listas não passam de 30 itens.

## O que mudou em relação ao plano

- **Fonte:** Lexend no lugar da Atkinson Hyperlegible Next (motivo na tabela da pesquisa).
- **Exportação:** "Excel" baixa um CSV com ponto e vírgula e acentos corretos, que abre direto no Excel: um arquivo de resumo e, para quem tem `exportacao:detalhada`, um com todas as respostas (telefone só para quem tem `contatos:ver`, com registro na auditoria). **"PDF" fica desabilitado**, com o aviso "chega junto com a API", como o plano permite.
- **Gestor em `/painel/setores`:** a rota aceita `setores:gerenciar` ou `perguntas:gerenciar`; quem só tem a segunda vê os seus setores sem editar.
- **Testes do fluxo:** os testes cobrem o redutor puro que o `useFluxoPesquisa` usa, sem renderizar o hook (evita acrescentar a Testing Library só para isso).
- **Ordenação das perguntas:** arrastar nativo do navegador, sem biblioteca. Por toque, a ordem muda pelas setas.
- **Bibliotecas além da stack do plano:** só a fonte (`@fontsource-variable/lexend`) e as dependências que o próprio shadcn/ui instala (`radix-ui`, `class-variance-authority`, `cn`, `tw-animate-css`, `sonner`). A `next-themes`, que o shadcn/ui também instala, foi removida: o painel é só claro.
- **Logo:** a cópia usada no app (`src/assets/logo.png`) foi otimizada de 168 kB para 5 kB, sem diferença visível. O original continua em `assets/img/logo.png`.

## Como foi verificado

- `pnpm lint`, `pnpm typecheck`, `pnpm test` (27 testes) e `pnpm build` sem erros.
- Pesquisa no celular (360×740 e 390×844): nota baixa com comentário e telefone, nota normal com elogio, todas as perguntas puladas só com a nota final, erro no envio com `?falha=envio` e novo envio sem duplicar.
- Totem em tablet em pé (768×1024) e totem vertical (1080×1920): turno automático, "Ainda está aí?", volta ao início por inatividade, reinício automático e nada da pesquisa no `localStorage`, no `sessionStorage` ou na URL.
- Uma avaliação enviada numa aba apareceu no dashboard ("hoje": NPS −100 em 1 resposta) e na TV (Raio-X de +100 em 6 para +71 em 7 respostas). Dashboard e TV mostraram o mesmo total do mês (76 respostas).
- Perfis: o Visualizador vê só "Indicadores", só o Raio-X e nenhum comentário, e recebe "Você não tem acesso a esta página" em `/painel/respostas`. O primeiro acesso leva direto à troca de senha e só libera o painel depois dela.
- Telefone revelado só depois da confirmação, com o registro na auditoria do mock.
- Sem rolagem horizontal em 360 px no painel e na pesquisa; TV sem rolagem em 1920×1080 e 3840×2160.
- Links diretos (`/s/...`, `/totem/...`, `/tv`, `/painel/...`) abrem depois do build, servidos pelo `vite preview`.
- Tamanho baixado: quem abre a pesquisa pelo QR Code baixa cerca de 150 kB de JavaScript comprimido, sem nenhum gráfico ou tela do painel.

## Pendências e dúvidas

- **Publicar** e o **manual de uso** são entregáveis da atividade, fora deste plano.
- **Validar com pessoas reais:** as personas são proto-personas. Vale testar a pesquisa com pacientes idosos no tablet antes da entrega.
- **Arrastar por toque** na lista de perguntas: hoje é pelas setas. Se fizer falta, trocar pelo `@dnd-kit`.
- **Testes de componentes e de ponta a ponta** ficam para a fase 2, como no Plano de Desenvolvimento.
- **Leitor de tela:** a estrutura (rótulos, grupos, foco, anúncios) foi conferida no código e pela árvore de acessibilidade do navegador, mas não com um leitor de tela de verdade (NVDA, TalkBack ou VoiceOver).
- **Pontos em aberto do hospital** continuam os mesmos do registro de 10/11 (turnos, texto do NPS, quem vê telefones, limite de "Outro dia", paciente ou acompanhante), mais o limite de 30 respostas para o aviso de amostra pequena.
- **Limitação do mock:** os dados ficam só no navegador onde foram gerados.
