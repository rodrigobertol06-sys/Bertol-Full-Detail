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

    let setorParam = (usuarioLogado.nivel.toLowerCase() === 'senior' || usuarioLogado.setor.toLowerCase() === 'sistema') ? setorAtivo : usuarioLogado.setor;

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

window.addEventListener('DOMContentLoaded', () => {
    carregarFiliaisHome();
});

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
                const classeBorda = ativo ? 'border-2 shadow-sm' : 'border border-slate-200 hover:border-slate-300';
                const estiloAtivo = ativo ? 'border-color: #300c07;' : '';

                return `
                    <div onclick="selecionarSetorCard('${setor}')" class="bg-white rounded-xl p-4 cursor-pointer transition-all ${classeBorda}" style="${estiloAtivo}">
                        <div class="text-sm font-bold text-slate-800">Setor: ${setor}</div>
                        <div class="text-xs text-slate-500 mt-1">${(usuarioLogado?.nivel === 'Senior' || usuarioLogado?.setor === 'Sistema') ? 'Acesso Master' : 'Acesso Setorial'}</div>
                    </div>
                `;
            }).join('');
        })
        .catch(err => console.error('Erro ao carregar setores:', err));
}

function selecionarSetorCard(setor) {
    setorAtivo = setor;
    carregarMiniCardsSetores(); 
    verificarFiltroVendas();
    
    if (typeof carregarDadosPlanilha === 'function') {
        carregarDadosPlanilha();
    }
}

// 023. Função para verificar e renderizar os cards de usuários de vendas com base no Superior Direto e Nível
function verificarFiltroVendas() {
    const painelVendas = document.getElementById('painel-filtro-vendas');
    const containerCardsUsuarios = document.getElementById('container-pilulas-usuarios');
    
    if (!painelVendas || !containerCardsUsuarios) return;

    if (setorAtivo && setorAtivo.toLowerCase() === 'vendas') {
        painelVendas.classList.remove('hidden');
        
        if (usuarioLogado && usuarioLogado.nivel.toLowerCase() === 'junior' && usuarioLogado.setor.toLowerCase() !== 'sistema') {
            painelVendas.classList.add('hidden');
            usuarioFiltroAtivo = usuarioLogado.usuario;
            return;
        }

        let usuariosPermitidos = filtrarUsuariosPorHierarquia(window.listaGlobalUsuarios || [], usuarioLogado);

        let htmlCards = `
            <div onclick="filtrarPorUsuarioVendas(null)" class="p-3 rounded-xl border cursor-pointer transition-all ${usuarioFiltroAtivo === null ? 'text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}" style="${usuarioFiltroAtivo === null ? 'background-color: #300c07; border-color: #300c07;' : ''}">
                <div class="text-xs font-bold">Todos os Usuários</div>
                <div class="text-[10px] opacity-80">Visão consolidada</div>
            </div>
        `;

        htmlCards += usuariosPermitidos.map(user => {
            const selecionado = usuarioFiltroAtivo === user.usuario;
            const estiloCard = selecionado ? 'background-color: #300c07; border-color: #300c07; color: white;' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300';
            
            return `
                <div onclick="filtrarPorUsuarioVendas('${user.usuario}')" class="p-3 rounded-xl border cursor-pointer transition-all ${selecionado ? 'text-white shadow-sm' : ''}" style="${estiloCard}">
                    <div class="text-xs font-bold">${user.usuario}</div>
                    <div class="text-[10px] opacity-80">Superior: ${user.superiorDireto || 'N/A'}</div>
                </div>
            `;
        }).join('');

        containerCardsUsuarios.innerHTML = htmlCards;
    } else {
        painelVendas.classList.add('hidden');
        usuarioFiltroAtivo = null;
    }
}

// 025. Função ao clicar no card de seleção do usuário de vendas
function filtrarPorUsuarioVendas(usuario) {
    usuarioFiltroAtivo = usuario;
    verificarFiltroVendas(); 
    
    if (typeof carregarDadosPlanilha === 'function') {
        carregarDadosPlanilha();
    }
}
