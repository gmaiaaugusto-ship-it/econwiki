# EconWiki

Wiki interativo de Introdução à Economia, desenvolvido para a unidade curricular de **Introdução à Economia** da Licenciatura em Direito da Universidade Católica Portuguesa.

## Estrutura

O site é composto por dois ficheiros HTML standalone, ligados entre si:

- **`index.html`** — Introdução ao Pensamento Económico. Capítulo introdutório com seis lições, exemplos guiados, gráficos interactivos e *quizzes*. Pensado como porta de entrada para quem nunca estudou Economia.
- **`EconWiki.html`** — Wiki principal de referência. Dezanove páginas organizadas em cinco grupos (Fundamentos, Estruturas de Mercado, Mercados: Informação, Trabalho e Digital, Falhas de Mercado, Macroeconomia). Cobre a generalidade dos conteúdos da disciplina, com gráficos SVG, tabelas comparativas e remissões cruzadas.

Os dois ficheiros são interligados por botões de navegação na barra superior e na *sidebar*. Partilham o mesmo sistema de cores, tipografia e modo claro/escuro (sincronizado via `localStorage`).

## Assistente de dúvidas (chat)

O ficheiro `EconWiki.html` inclui um chat ligado à API Claude da Anthropic. Para usar:

1. Obter uma chave de API em [console.anthropic.com](https://console.anthropic.com/) (a Anthropic oferece créditos iniciais gratuitos para experimentar)
2. Clicar no ícone de engrenagem no canto inferior esquerdo do site
3. Introduzir a chave

A chave é guardada apenas no `localStorage` do browser; não passa por qualquer servidor além da API da Anthropic.

## Tecnologia

Desenvolvido em **HTML, CSS e JavaScript puro**, sem *frameworks* nem *build steps*. Os gráficos são SVG inline, com geometria construída a partir das funções económicas subjacentes (a sua maioria gerada computacionalmente em Python e depois injectada no SVG).

## Modo claro/escuro

Ambos os ficheiros suportam tema claro e escuro. A preferência é partilhada entre os dois através de `localStorage`.

## Acessibilidade

- Os SVG dos gráficos têm `role="img"`, `<title>` e `aria-label` descritivos
- As tabelas têm descrições alternativas para leitores de ecrã (classe `.sr-only`)
- Português europeu pós-Acordo Ortográfico de 1990

## Licença

Este projeto destina-se a uso académico. Os conteúdos doutrinais citam manuais e fontes específicas dentro do próprio site.

---

*Última atualização do site: maio de 2026.*
