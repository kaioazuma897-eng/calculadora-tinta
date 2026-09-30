# Calculadora de Tinta

Ferramenta web que calcula quanta tinta comprar para pintar um ambiente, sugere a combinação de embalagens mais barata e gera o orçamento em PDF ou pelo WhatsApp.

Nasceu de um problema real do balcão de uma loja de tintas: o cliente chega com as medidas "de cabeça" e o cálculo é feito à mão, com risco de faltar tinta ou de o cliente levar embalagem demais.

**Demo:** https://kaioazuma897-eng.github.io/calculadora-tinta/

## Funcionalidades

- Vários cômodos, com desconto automático de portas e janelas e opção de pintar o teto
- Rendimento, número de demãos e margem de perda configuráveis
- **Otimização de embalagens:** encontra a combinação mais barata (lata 18 L, galão 3,6 L, quarto 0,9 L) que cobre a quantidade necessária
- Preços editáveis e salvos no navegador
- Orçamento em PDF pronto para imprimir ou enviar
- Envio do resumo pelo WhatsApp com um clique
- Layout responsivo e tema escuro automático

## Como funciona o cálculo

1. **Área** = perímetro × altura − (portas × 1,68 m²) − (janelas × 1,20 m²) + teto (opcional)
2. **Litros** = área × demãos ÷ rendimento × (1 + perda)
3. **Embalagens:** programação dinâmica (variação do *problema da mochila*). Para cada volume possível, em décimos de litro, guarda o menor custo para alcançá-lo e depois escolhe o volume mais barato que cobre o necessário. Em caso de empate, escolhe o que sobra menos tinta.

   Exemplo: para 5 L, um galão + 2 quartos (R$ 159) sai mais barato que 2 galões (R$ 190).

## Tecnologias

HTML, CSS e JavaScript puro, sem frameworks e sem etapa de build. A lógica de cálculo (`js/calculo.js`) fica separada da interface (`js/app.js`) e tem testes automatizados.

## Rodando localmente

Abra o `index.html` no navegador. Para rodar os testes, abra o `tests.html`.

## Próximos passos

- [ ] Cadastro de produtos com rendimento próprio (acrílica, esmalte, textura)
- [ ] Dados da loja (logo, CNPJ, contato) no orçamento
- [ ] Histórico de orçamentos
