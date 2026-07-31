// 010. Módulo de Autenticação e Gestão de Sessão (Login e Permissões)
const URL_WEB_APP = "https://script.google.com/macros/s/AKfycbzKs_U5cHE-r3hd3iIRFKiM0TR_JpTf7b6DAyLzRS8506sMWV3o83ir0_rymNIAIeEN/exec"; // Cole aqui a URL do Apps Script

let usuarioLogado = null;
let setorAtivo = '';

// 011. Função que executa a validação de usuário e senha na aba Configurações
function realizarLogin() {
    const usuarioInput = document.getElementById('usuario-input').value.trim();
    const senhaInput = document.getElementById('senha-input').value.trim();

    if(!usuarioInput || !senhaInput) {
        alert('Por favor, preencha o usuário e a senha.');
        return;
    }

    fetch(`${URL_WEB_APP}?acao=carregarUsuarios`)
        .then(res => res.json())
        .then(usuarios => {
            const encontrado = usuarios.find(u => u.usuario.toLowerCase() === usuarioInput.toLowerCase() && u.senha === senhaInput);
            if (!encontrado) {
                alert('Usuário ou senha incorretos!');
                return;
            }

            usuarioLogado = encontrado;
            document.getElementById('modal-login').classList.add('hidden');
            document.getElementById('info-usuario-logado').innerText = `${usuarioLogado.usuario} (${usuarioLogado.nivel} - ${usuarioLogado.setor})`;
            document.getElementById('texto-botao-login').innerText = 'Trocar Usuário';

            configurarInterfacePorAcesso();
            carregarDadosPlanilha();
        })
        .catch(err => {
            console.error('Erro no login:', err);
            alert('Erro ao conectar com a planilha de configurações.');
        });
}

// 012. Configuração visual e de restrição com base no Nível de Acesso (Senior, Pleno, Junior)
function configurarInterfacePorAcesso() {
    const containerSetores = document.getElementById('secao-setores-container');
    const gridSetores = document.getElementById('cards-setores-grid');
    
    if (usuarioLogado.nivel.toLowerCase() === 'senior') {
        containerSetores.classList.remove('hidden');
        const setoresDisponiveis = ["Vendas", "SAC", "Financeiro", "Operações"]; 
        
        gridSetores.innerHTML = setoresDisponiveis.map(setor => `
            <button onclick="filtrarPorSetor('${setor}')" class="p-3 rounded-xl border border-slate-200 bg-white text-left font-semibold hover:bg-slate-50 transition-all">
                <span class="block font-bold text-[#300c07]">Setor: ${setor}</span>
                <span class="text-[10px] text-slate-500">Acesso Master</span>
            </button>
        `).join('');
        setorAtivo = ''; 
    } else {
        containerSetores.classList.add('hidden');
        setorAtivo = usuarioLogado.setor;
    }
}

// 013. Função para abrir o modal de login manualmente
function abrirModalLogin() {
    document.getElementById('modal-login').classList.remove('hidden');
}
