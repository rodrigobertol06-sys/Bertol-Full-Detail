// 010. Módulo de Autenticação e Sessão
const URL_WEB_APP = "https://script.google.com/macros/s/AKfycbzKs_U5cHE-r3hd3iIRFKiM0TR_JpTf7b6DAyLzRS8506sMWV3o83ir0_rymNIAIeEN/exec"; 

let usuarioLogado = null;
let setorAtivo = '';
window.listaGlobalUsuarios = []; 

// Ao carregar a página, verifica se já há sessão salva
window.addEventListener('DOMContentLoaded', () => {
    const usuarioSalvo = sessionStorage.getItem('usuarioLogado_ct');
    if (usuarioSalvo) {
        usuarioLogado = JSON.parse(usuarioSalvo);
        
        document.getElementById('info-usuario-logado').innerText = `${usuarioLogado.usuario} (${usuarioLogado.nivel} - ${usuarioLogado.setor})`;
        document.getElementById('texto-botao-login').innerText = 'Trocar Usuário';
        
        ativarMenuLateral(true);

        fetch(`${URL_WEB_APP}?acao=carregarUsuarios`)
            .then(res => res.json())
            .then(usuarios => {
                window.listaGlobalUsuarios = usuarios;
                configurarInterfacePorAcesso();
            })
            .catch(err => console.error('Erro ao carregar usuários da sessão:', err));
    }
});

// 011. Função que executa a validação de usuário e senha
function realizarLogin() {
    const usuarioInput = document.getElementById('usuario-input').value.trim();
    const senhaInput = document.getElementById('senha-input').value.trim();
    const btnEntrar = document.querySelector('#modal-login button[onclick="realizarLogin()"]');

    if(!usuarioInput || !senhaInput) {
        alert('Por favor, preencha o usuário e a senha.');
        return;
    }

    const textoOriginal = btnEntrar.innerHTML;
    btnEntrar.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Carregando...';
    btnEntrar.disabled = true;

    fetch(`${URL_WEB_APP}?acao=carregarUsuarios`)
        .then(res => res.json())
        .then(usuarios => {
            btnEntrar.innerHTML = textoOriginal;
            btnEntrar.disabled = false;
            window.listaGlobalUsuarios = usuarios;

            const encontrado = usuarios.find(u => u.usuario.toLowerCase() === usuarioInput.toLowerCase() && u.senha === senhaInput);
            if (!encontrado) {
                alert('Usuário ou senha incorretos!');
                return;
            }

            usuarioLogado = encontrado;
            sessionStorage.setItem('usuarioLogado_ct', JSON.stringify(usuarioLogado));

            fecharModalLogin();
            
            document.getElementById('info-usuario-logado').innerText = `${usuarioLogado.usuario} (${usuarioLogado.nivel} - ${usuarioLogado.setor})`;
            document.getElementById('texto-botao-login').innerText = 'Trocar Usuário';

            ativarMenuLateral(true);
            configurarInterfacePorAcesso();
            
            mudarParaTela('dados');
            carregarDadosPlanilha();
        })
        .catch(err => {
            console.error('Erro no login:', err);
            btnEntrar.innerHTML = textoOriginal;
            btnEntrar.disabled = false;
            alert('Erro ao conectar com a planilha de configurações.');
        });
}

// 012. Configuração visual por Nível de Acesso ou Setor Sistema
function configurarInterfacePorAcesso() {
    const containerSetores = document.getElementById('secao-setores-container');
    
    if (usuarioLogado && (usuarioLogado.nivel.toLowerCase() === 'senior' || usuarioLogado.setor.toLowerCase() === 'sistema')) {
        containerSetores.classList.remove('hidden');
        
        if (typeof carregarMiniCardsSetores === 'function') {
            carregarMiniCardsSetores();
        }
        
        setorAtivo = ''; 
    } else if (usuarioLogado) {
        containerSetores.classList.add('hidden');
        setorAtivo = usuarioLogado.setor;
        
        if (typeof verificarFiltroVendas === 'function') {
            verificarFiltroVendas();
        }
    }
}

// 013. Funções de controle de modais e menus
function abrirModalLogin() {
    document.getElementById('modal-login').classList.remove('hidden');
    document.getElementById('usuario-input').focus();
}

function fecharModalLogin() {
    document.getElementById('modal-login').classList.add('hidden');
}

window.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('modal-login');
        if (modal && !modal.classList.contains('hidden')) {
            fecharModalLogin();
        }
    }
});

function ativarMenuLateral(ativar) {
    const sidebar = document.getElementById('sidebar-sistema');
    const btnMenu = document.getElementById('btnMenu');
    if (ativar) {
        sidebar.classList.remove('hidden');
        sidebar.classList.add('flex');
        btnMenu.classList.remove('hidden');
    } else {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('flex');
        btnMenu.classList.add('hidden');
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar-sistema');
    if (sidebar.classList.contains('hidden')) {
        sidebar.classList.remove('hidden');
        sidebar.classList.add('flex');
    } else {
        sidebar.classList.add('hidden');
        sidebar.classList.remove('flex');
    }
}

function mudarParaTela(tela) {
    if (tela === 'home') {
        document.getElementById('tela-home').classList.remove('hidden');
        document.getElementById('tela-dados').classList.add('hidden');
    } else if (tela === 'dados') {
        if (!usuarioLogado) {
            alert('Por favor, faça o login primeiro.');
            abrirModalLogin();
            return;
        }
        document.getElementById('tela-home').classList.add('hidden');
        document.getElementById('tela-dados').classList.remove('hidden');
    }
}

// 027. Função auxiliar para validar hierarquia e permissão global do setor Sistema
function filtrarUsuariosPorHierarquia(listaUsuarios, logado) {
    if (!logado) return [];
    
    const nivelLogado = logado.nivel ? logado.nivel.toLowerCase() : '';
    const setorLogado = logado.setor ? logado.setor.trim().toLowerCase() : '';
    const nomeLogado = logado.usuario ? logado.usuario.trim().toLowerCase() : '';

    return listaUsuarios.filter(u => {
        const nivelUser = u.nivel ? u.nivel.toLowerCase() : '';
        const setorUser = u.setor ? u.setor.trim().toLowerCase() : '';
        const superiorUser = u.superiorDireto ? u.superiorDireto.trim().toLowerCase() : '';
        const nomeUser = u.usuario ? u.usuario.trim().toLowerCase() : '';

        // Se o usuário logado for do setor "Sistema" ou tiver nível "Senior", acesso total (vê tudo de todos)
        if (setorLogado === 'sistema' || nivelLogado === 'senior') {
            return true; 
        }

        // Deve pertencer ao mesmo setor obrigatoriamente
        if (setorUser !== setorLogado) {
            return false;
        }

        if (nivelLogado === 'pleno') {
            // O Pleno vê a si mesmo, qualquer Júnior do setor, ou quem tiver ele como superior direto
            return nomeUser === nomeLogado || nivelUser === 'junior' || superiorUser === nomeLogado; 
        } else if (nivelLogado === 'junior') {
            return nomeUser === nomeLogado; 
        }
        
        return false;
    });
}
