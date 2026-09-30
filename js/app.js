// Interface: lê os campos, chama as funções de calculo.js e mostra o resultado.

const CHAVE_STORAGE = 'calculadora-tinta';

const estadoInicial = {
  comodos: [
    { nome: 'Sala', largura: 4, comprimento: 5, altura: 2.7, portas: 1, janelas: 1, pintarTeto: false },
  ],
  tinta: { rendimento: 10, demaos: 2, perda: 10 },
  embalagens: [
    { nome: 'Lata', litros: 18, preco: 380 },
    { nome: 'Galão', litros: 3.6, preco: 95 },
    { nome: 'Quarto', litros: 0.9, preco: 32 },
  ],
  cliente: '',
  mostrarPrecos: true,
};

let estado = carregar();

function carregar() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_STORAGE));
    if (salvo && Array.isArray(salvo.comodos)) return { ...structuredClone(estadoInicial), ...salvo };
  } catch (e) { /* sem storage disponível: segue com o padrão */ }
  return structuredClone(estadoInicial);
}

function salvar() {
  try { localStorage.setItem(CHAVE_STORAGE, JSON.stringify(estado)); } catch (e) { /* ignora */ }
}

const numero = (v, casas = 2) => v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
const reais = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const $ = (id) => document.getElementById(id);

// ---------- Cômodos ----------

function novoComodo() {
  return { nome: `Cômodo ${estado.comodos.length + 1}`, largura: 3, comprimento: 3, altura: 2.7, portas: 1, janelas: 1, pintarTeto: false };
}

function renderizarComodos() {
  const lista = $('lista-comodos');
  const modelo = $('modelo-comodo');
  lista.innerHTML = '';

  estado.comodos.forEach((comodo, indice) => {
    const card = modelo.content.firstElementChild.cloneNode(true);
    card.querySelectorAll('[data-campo]').forEach((campo) => {
      const chave = campo.dataset.campo;
      if (campo.type === 'checkbox') campo.checked = comodo[chave];
      else campo.value = comodo[chave];

      campo.addEventListener('input', () => {
        if (campo.type === 'checkbox') comodo[chave] = campo.checked;
        else if (campo.type === 'number') comodo[chave] = Math.max(parseFloat(campo.value) || 0, 0);
        else comodo[chave] = campo.value;
        atualizar();
      });
    });

    card.querySelector('.remover').addEventListener('click', () => {
      estado.comodos.splice(indice, 1);
      renderizarComodos();
      atualizar();
    });
    lista.appendChild(card);
  });
}

// ---------- Configurações de tinta e embalagens ----------

function ligarTinta() {
  ['rendimento', 'demaos', 'perda'].forEach((chave) => {
    const campo = $(chave);
    campo.value = estado.tinta[chave];
    campo.addEventListener('input', () => {
      estado.tinta[chave] = Math.max(parseFloat(campo.value) || 0, 0);
      atualizar();
    });
  });

  const cliente = $('cliente');
  cliente.value = estado.cliente;
  cliente.addEventListener('input', () => { estado.cliente = cliente.value; salvar(); });

  const mostrarPrecos = $('mostrar-precos');
  mostrarPrecos.checked = estado.mostrarPrecos;
  mostrarPrecos.addEventListener('change', () => { estado.mostrarPrecos = mostrarPrecos.checked; salvar(); });
}

function renderizarEmbalagens() {
  const corpo = $('lista-embalagens');
  corpo.innerHTML = '';
  estado.embalagens.forEach((emb) => {
    const linha = document.createElement('tr');
    linha.innerHTML = `
      <td>${emb.nome}</td>
      <td>${numero(emb.litros, 1)} L</td>
      <td><input type="number" min="0" step="0.01" aria-label="Preço ${emb.nome}"></td>`;
    const preco = linha.querySelector('input');
    preco.value = emb.preco;
    preco.addEventListener('input', () => {
      emb.preco = Math.max(parseFloat(preco.value) || 0, 0);
      atualizar();
    });
    corpo.appendChild(linha);
  });
}

// ---------- Cálculo e resultado ----------

function calcular() {
  const areas = estado.comodos.map(areaComodo);
  const areaTotal = areas.reduce((soma, a) => soma + a.total, 0);
  const litros = litrosNecessarios(areaTotal, estado.tinta);
  const compra = melhorCombinacao(litros, estado.embalagens);
  return { areas, areaTotal, litros, compra };
}

function descreverItem(item) {
  return `${item.quantidade}× ${item.nome} ${numero(item.litros, 1)} L`;
}

function atualizar() {
  const r = calcular();

  document.querySelectorAll('#lista-comodos .comodo').forEach((card, i) => {
    const a = r.areas[i];
    card.querySelector('.area-comodo').textContent =
      `Paredes: ${numero(a.paredes)} m²` + (a.teto ? ` · Teto: ${numero(a.teto)} m²` : '') + ` · Total: ${numero(a.total)} m²`;
  });

  $('res-area').textContent = `${numero(r.areaTotal)} m²`;
  $('res-litros').textContent = `${numero(r.litros, 1)} L`;
  $('res-custo').textContent = reais(r.compra.custo);

  const lista = $('res-embalagens');
  lista.innerHTML = '';
  r.compra.itens.forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${descreverItem(item)}</span><span>${reais(item.quantidade * item.preco)}</span>`;
    lista.appendChild(li);
  });

  const sobra = r.compra.volume - r.litros;
  $('res-sobra').textContent = r.compra.itens.length
    ? `Você leva ${numero(r.compra.volume, 1)} L (sobram cerca de ${numero(Math.max(sobra, 0), 1)} L).`
    : 'Adicione um cômodo para calcular.';

  salvar();
  return r;
}

// ---------- Orçamento: PDF e WhatsApp ----------

function montarOrcamento(r) {
  const hoje = new Date().toLocaleDateString('pt-BR');
  const comPrecos = estado.mostrarPrecos;
  const linhasComodos = estado.comodos.map((c, i) => `
    <tr><td>${escapar(c.nome)}</td><td>${numero(c.largura)} × ${numero(c.comprimento)} × ${numero(c.altura)} m</td>
    <td>${numero(r.areas[i].total)} m²</td></tr>`).join('');
  const linhasItens = r.compra.itens.map((item) => `
    <tr><td>${item.quantidade}</td><td>${item.nome} ${numero(item.litros, 1)} L</td>
    ${comPrecos ? `<td>${reais(item.preco)}</td><td>${reais(item.quantidade * item.preco)}</td>` : ''}</tr>`).join('');
  const cabecalhoPrecos = comPrecos ? '<th>Unitário</th><th>Subtotal</th>' : '';
  const fechamento = comPrecos
    ? `<p class="total">Total: ${reais(r.compra.custo)}</p>
       <p class="rodape">Orçamento válido por 7 dias. Valores sujeitos a alteração.</p>`
    : `<p class="total">Total: ${numero(r.compra.volume, 1)} L de tinta</p>`;

  $('orcamento').innerHTML = `
    <h1>${comPrecos ? 'Orçamento de tinta' : 'Lista de tinta'}</h1>
    <p>Data: ${hoje}${estado.cliente ? ` · Cliente: ${escapar(estado.cliente)}` : ''}</p>
    <h2>Cômodos</h2>
    <table><thead><tr><th>Cômodo</th><th>Medidas (L × C × A)</th><th>Área</th></tr></thead><tbody>${linhasComodos}</tbody></table>
    <p>Área total: ${numero(r.areaTotal)} m² · ${estado.tinta.demaos} demão(s) · rendimento ${numero(estado.tinta.rendimento, 1)} m²/L
      · perda ${estado.tinta.perda}% → ${numero(r.litros, 1)} L necessários</p>
    <h2>Produtos</h2>
    <table><thead><tr><th>Qtd.</th><th>Embalagem</th>${cabecalhoPrecos}</tr></thead><tbody>${linhasItens}</tbody></table>
    ${fechamento}`;
}

function textoWhatsApp(r) {
  const comPrecos = estado.mostrarPrecos;
  const linhas = [
    comPrecos ? '*Orçamento de tinta*' : '*Lista de tinta*',
    estado.cliente ? `Cliente: ${estado.cliente}` : null,
    `Área total: ${numero(r.areaTotal)} m² (${estado.tinta.demaos} demãos)`,
    `Tinta necessária: ${numero(r.litros, 1)} L`,
    '',
    ...r.compra.itens.map((item) =>
      comPrecos ? `• ${descreverItem(item)}: ${reais(item.quantidade * item.preco)}` : `• ${descreverItem(item)}`),
    '',
    comPrecos ? `*Total: ${reais(r.compra.custo)}*` : `*Total: ${numero(r.compra.volume, 1)} L de tinta*`,
  ];
  return linhas.filter((l) => l !== null).join('\n');
}

function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

// ---------- Inicialização ----------

$('adicionar-comodo').addEventListener('click', () => {
  estado.comodos.push(novoComodo());
  renderizarComodos();
  atualizar();
});

$('gerar-pdf').addEventListener('click', () => {
  montarOrcamento(calcular());
  window.print(); // no diálogo, escolher "Salvar como PDF"
});

$('whatsapp').addEventListener('click', () => {
  const url = 'https://wa.me/?text=' + encodeURIComponent(textoWhatsApp(calcular()));
  window.open(url, '_blank', 'noopener');
});

renderizarComodos();
renderizarEmbalagens();
ligarTinta();
atualizar();
