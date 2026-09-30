// Funções puras de cálculo: não mexem na página, por isso podem ser testadas isoladamente (ver tests.html).

const ABERTURAS = {
  porta: { largura: 0.8, altura: 2.1 },
  janela: { largura: 1.2, altura: 1.0 },
};

// Área pintável de um cômodo em m², descontando portas e janelas.
function areaComodo(comodo) {
  const { largura, comprimento, altura, portas, janelas, pintarTeto } = comodo;
  const paredesBrutas = 2 * (largura + comprimento) * altura;
  const aberturas =
    portas * ABERTURAS.porta.largura * ABERTURAS.porta.altura +
    janelas * ABERTURAS.janela.largura * ABERTURAS.janela.altura;
  const paredes = Math.max(paredesBrutas - aberturas, 0);
  const teto = pintarTeto ? largura * comprimento : 0;
  return { paredes, teto, total: paredes + teto };
}

// Litros de tinta para cobrir a área com o número de demãos, somando a margem de perda (%).
function litrosNecessarios(area, { rendimento, demaos, perda }) {
  if (area <= 0 || rendimento <= 0) return 0;
  return (area * demaos / rendimento) * (1 + perda / 100);
}

// Escolhe a combinação de embalagens mais barata que cobre os litros necessários.
// Em caso de empate no preço, fica com a que sobra menos tinta.
// Trabalha com décimos de litro e centavos para evitar erros de arredondamento.
function melhorCombinacao(litros, embalagens) {
  const validas = embalagens.filter((e) => e.litros > 0 && e.preco >= 0);
  if (litros <= 0 || validas.length === 0) return { itens: [], volume: 0, custo: 0 };

  const tamanhos = validas.map((e) => Math.round(e.litros * 10));
  const precos = validas.map((e) => Math.round(e.preco * 100));
  const alvo = Math.ceil(litros * 10 - 1e-9);
  const limite = alvo + Math.max(...tamanhos);

  // custo[v] = menor custo para somar exatamente v décimos de litro
  const custo = new Array(limite + 1).fill(Infinity);
  const ultima = new Array(limite + 1).fill(-1);
  custo[0] = 0;
  for (let v = 1; v <= limite; v++) {
    for (let i = 0; i < tamanhos.length; i++) {
      const anterior = v - tamanhos[i];
      if (anterior >= 0 && custo[anterior] + precos[i] < custo[v]) {
        custo[v] = custo[anterior] + precos[i];
        ultima[v] = i;
      }
    }
  }

  let melhor = -1;
  for (let v = alvo; v <= limite; v++) {
    if (custo[v] < Infinity && (melhor === -1 || custo[v] < custo[melhor])) melhor = v;
  }

  const quantidades = new Array(validas.length).fill(0);
  for (let v = melhor; v > 0; v -= tamanhos[ultima[v]]) quantidades[ultima[v]]++;

  const itens = validas
    .map((e, i) => ({ ...e, quantidade: quantidades[i] }))
    .filter((e) => e.quantidade > 0)
    .sort((a, b) => b.litros - a.litros);
  return { itens, volume: melhor / 10, custo: custo[melhor] / 100 };
}
