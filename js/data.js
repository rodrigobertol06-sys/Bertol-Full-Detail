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

// 018. Função para carregar as filiais na tela Home ao abrir o site
function carregarFiliaisHome() {
    const corpoFiliais = document.getElementById('tabela-filiais-corpo');
    if (!corpoFiliais) return;

    fetch(`${URL_WEB_APP}?acao=carregarFiliais`)
        .then(res => res.json())
        .then(filiais => {
            if (!filiais || filiais.length === 0) {
                corpoFiliais.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-500">Nenhuma filial cadastrada.</td></tr>`;
                return;
            }

            corpoFiliais.innerHTML = filiais.map(f => `
                <tr class="hover:bg-slate-50">
                    <td class="p-3 font-bold text-[#300c07]">${f.tipo}</td>
                    <td class="p-3 text-slate-600">${f.endereco}</td>
                    <td class="p-3 text-slate-600">${f.cidadeUF}</td>
                    <td class="p-3 text-slate-600">${f.telefone}</td>
                </tr>
            `).join('');
        })
        .catch(err => {
            console.error('Erro ao carregar filiais:', err);
            corpoFiliais.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-500">Erro ao carregar os dados das filiais.</td></tr>`;
        });
}

// Dispara o carregamento das filiais ao abrir a página
window.addEventListener('DOMContentLoaded', () => {
    carregarFiliaisHome();
});
// Exemplo de lista de usuários do setor de vendas (você pode puxar dinamicamente da sua tabela de login)
const usuariosVendas = ["Felipe", "Natanael", "Nicole", "Aline", "Ester", "Gabrieli", "Thamiris", "Karen"];
let usuarioFiltroAtivo = null;

function carregarMiniCardsSetores() {
    const container = document.getElementById('container-mini-cards');
    if (!container) return;

    fetch(`${URL_WEB_APP}?acao=obterSetores`)
        .then(res => res.json())
        .then(setores => {
            if (!setores || setores.length === 0) {
                container.innerHTML = `<p class="text-xs text-slate-500">Nenhum setor cadastrado na coluna Q.</p>`;
                return;
            }

            container.innerHTML = setores.map(setor => {
                const ativo = setorAtivo === setor;
                // Estilo dinâmico para destacar o card selecionado (igual ao da sua imagem)
                const classeBorda = ativo ? 'border-2 border-slate-900 shadow-sm' : 'border border-slate-200 hover:border-slate-300';

                return `
                    <div onclick="selecionarSetorCard('${setor}')" class="bg-white rounded-xl p-4 cursor-pointer transition-all ${classeBorda}">
                        <div class="text-sm font-bold text-slate-800">Setor: ${setor}</div>
                        <div class="text-xs text-slate-500 mt-1">${usuarioLogado?.nivel === 'Senior' ? 'Acesso Master' : 'Acesso Setorial'}</div>
                    </div>
                `;
            }).join('');
        })
        .catch(err => console.error('Erro ao carregar setores:', err));
}

function selecionarSetorCard(setor) {
    setorAtivo = setor;
    carregarMiniCardsSetores(); // Atualiza os estilos dos cards
    verificarFiltroVendas();
    
    // Se houver uma função que recarrega a tabela de dados, chame-a aqui:
    if (typeof carregarDadosPlanilha === 'function') {
        carregarDadosPlanilha();
    }
}

function verificarFiltroVendas() {
    const painelVendas = document.getElementById('painel-filtro-vendas');
    const containerPilulas = document.getElementById('container-pilulas-usuarios');
    
    if (!painelVendas || !containerPilulas) return;

    // Se o setor ativo for Vendas, exibe as pílulas dos usuários
    if (setorAtivo && setorAtivo.toLowerCase() === 'vendas') {
        painelVendas.classList.remove('hidden');
        
        // Renderiza o botão "Todos" + um filtro em pílula para cada usuário de vendas
        let htmlPilulas = `
            <button onclick="filtrarPorUsuarioVendas(null)" class="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${usuarioFiltroAtivo === null ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                Todos
            </button>
        `;

        htmlPilulas += usuariosVendas.map(user => {
            const selecionado = usuarioFiltroAtivo === user;
            const classePilula = selecionado ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200';
            return `
                <button onclick="filtrarPorUsuarioVendas('${user}')" class="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${classePilula}">
                    ${user}
                </button>
            `;
        }).join('');

        containerPilulas.innerHTML = htmlPilulas;
    } else {
        painelVendas.classList.add('hidden');
        usuarioFiltroAtivo = null;
    }
}

function filtrarPorUsuarioVendas(usuario) {
    usuarioFiltroAtivo = usuario;
    verificarFiltroVendas(); // Atualiza o visual das pílulas
    
    // Aqui você integrará a lógica futura para filtrar as atividades do usuário selecionado nas tabelas
    console.log(`Filtrando atividades para o usuário de vendas: ${usuario || 'Todos'}`);
}
