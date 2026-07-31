// 014. Módulo de Manipulação de Dados, Filtros de Setor e Tabelas
function filtrarPorSetor(setor) {
    setorAtivo = setor;
    document.getElementById('titulo-painel-dados').innerText = `Dados do Setor: ${setor}`;
    carregarDadosPlanilha();
}

// 015. Função que busca os dados consolidados na API do Apps Script considerando as permissões
function carregarDadosPlanilha() {
    if (!usuarioLogado) return;

    const corpo = document.getElementById('tabela-corpo');
    const cabecalho = document.getElementById('tabela-cabecalho');
    corpo.innerHTML = `<tr><td colspan="10" class="p-4 text-center text-slate-500">Buscando dados...</td></tr>`;

    let setorParam = usuarioLogado.nivel.toLowerCase() === 'senior' ? setorAtivo : usuarioLogado.setor;

    fetch(`${URL_WEB_APP}?acao=obterDados&setor=${encodeURIComponent(setorParam)}`)
        .then(response => response.json())
        .then(dados => {
            if (!dados || dados.length === 0) {
                corpo.innerHTML = `<tr><td colspan="10" class="p-4 text-center text-slate-500">Nenhum registro encontrado.</td></tr>`;
                cabecalho.innerHTML = '';
                return;
            }

            const chaves = Object.keys(dados[0]);
            cabecalho.innerHTML = `<tr>` + chaves.map(k => `<th class="p-3 font-bold">${k}</th>`).join('') + `</tr>`;
            corpo.innerHTML = dados.map(row => `<tr class="hover:bg-slate-50">` + chaves.map(k => `<td class="p-3">${row[k] !== undefined ? row[k] : ''}</td>`).join('') + `</tr>`).join('');
        })
        .catch(erro => {
            console.error('Erro ao carregar dados:', erro);
            corpo.innerHTML = `<tr><td colspan="10" class="p-4 text-center text-red-600">Erro ao carregar dados da planilha.</td></tr>`;
        });
}
