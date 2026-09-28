# RFTools

[English](README.md) · **Português**

Calculadoras e referências para engenharia de RF, Wi-Fi e redes, com perfil regulatório Brasil / ANATEL.

**Site no ar:** https://rftools-gray.vercel.app

Tudo roda no navegador. Nenhum dado sai do seu computador.

## Ferramentas

| Área | Ferramenta | O que faz |
|---|---|---|
| RF | Conversor dBm | Converte entre dBm, mW e W. |
| RF | Calculadora de EIRP | EIRP e potência conduzida total a partir da potência por cadeia de TX, ganho da antena, perda no cabo e número de cadeias. Compara potência conduzida, EIRP e PSD com os limites da ANATEL. |
| RF | Link Budget | FSPL, potência recebida, margem do enlace, zona de Fresnel e o maior MCS / PHY rate que o enlace suporta, com sensibilidade de receptor genérica ou personalizada. |
| RF | Atenuação de RF | Perdas típicas de materiais comuns em 2.4, 5 e 6 GHz. |
| RF | Antenas | Comprimento de onda, ½λ e ¼λ, zona de Fresnel e distância de Fraunhofer. |
| RF | Ruído / SNR | Ruído térmico (kTB), piso de ruído do receptor, SNR e sensibilidade estimada por MCS. Temperatura em °C. |
| Wi-Fi | Mapa de Canais | Canais de 2.4, 5 e 6 GHz por largura, com DFS e perfil ANATEL. |
| Wi-Fi | PHY Rate | PHY rate de Wi-Fi 5/6/7 por MCS, largura de canal, spatial streams e guard interval. |
| Wi-Fi | Capacidade Wi-Fi | Capacidade por airtime, throughput por cliente, mix de MCS e APs multi-rádio. |
| Wi-Fi | Planejador de Rede | Quantidade de APs por capacidade e por cobertura, com cobertura calculada por link budget e biblioteca de perdas por material. |
| Redes | Sub-rede IPv4 | Rede, broadcast, faixa de hosts, máscaras e wildcard. |
| PoE | Calculadora de PoE | Orçamento de potência para 802.3af/at/bt, perda resistiva no cabo, corrente e margem. |

A interface está disponível em **português e inglês** (botão PT | EN no topo).

## Perfil regulatório ANATEL

A Calculadora de EIRP e o Mapa de Canais verificam uma configuração contra as regras brasileiras para equipamentos de radiação restrita:

- **Ato nº 14448/2017**: requisitos técnicos, com as alterações do
  - **Ato nº 14158/2025**: limites em 5 GHz (itens 11.1 a 11.5);
  - **Ato nº 1306/2021**: limites em 6 GHz para APs indoor, clientes e equipamentos VLP (item 11.7);
  - **Ato nº 10400/2026**: Wi-Fi em 6 GHz restrito a **5.925–6.425 MHz**, obrigatório a partir de **01/03/2027**.
- Os limites de potência conduzida valem para a **soma de todas as cadeias de TX** (item 10.3.4).
- A PSD é **estimada** supondo potência distribuída de forma uniforme no canal. Nos ensaios de certificação ela é medida na largura de 26 dB da emissão, então os valores reais podem ser diferentes.

É uma ferramenta de apoio à engenharia e não substitui a análise completa de certificação. Os limites ficam em `src/data/regulatoryPower.ts` e têm testes automáticos; confira com o texto atual da ANATEL antes de confiar neles.

## Rodando localmente

Requisitos: Node.js 20+ e npm 10+.

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm test         # testes das regras regulatórias (Vitest)
npm run build    # checagem de tipos e build de produção em dist/
npm run preview  # serve o build de produção
```

## Estrutura do projeto

```
src/
  calculations/   fórmulas puras (RF, link budget, PHY rate, capacidade, PoE, sub-rede)
  data/           dados de referência: canais, regras da ANATEL, materiais, sensibilidade, lista de ferramentas
  pages/          uma página por ferramenta, agrupadas por área (RF, Wifi, Networking)
  components/     layout, menu lateral e cards do painel
  i18n.tsx        troca de idioma e funções de tradução
```

### Adicionando uma ferramenta

1. Crie a página em `src/pages/<Área>/`.
2. Adicione a rota em `src/App.tsx`.
3. Adicione um item em `src/data/tools.ts`. O menu lateral e o painel leem dessa mesma lista.

### Escrevendo textos da interface

Todo texto visível precisa existir nos dois idiomas:

- Nos componentes, use `t('Texto em português', 'English text')`, que vem de `useI18n()`.
- Nos arquivos de dados, use um objeto `{ pt: '…', en: '…' }` e mostre com `tl(...)`.

Mantenha os termos técnicos (EIRP, PSD, MCS, SNR, PHY rate…) iguais nos dois idiomas.

## Deploy

O site é publicado no Vercel. Todo push na `main` vai para produção, e todo pull request ganha um deploy de preview. O `vercel.json` manda todas as rotas para o `index.html`, para que links diretos e o F5 funcionem.
