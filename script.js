// ==========================================
// LÓGICA DE LOGIN / CONVIDADO
// ==========================================

// Função acionada ao clicar em "Entrar como Convidado"
function entrarComoConvidado() {
    // Seleciona a tela de login e remove a classe 'active' para ocultá-la
    const overlay = document.getElementById('authOverlay');
    overlay.classList.remove('active');
    // Permite rolar a página principal (caso estivesse bloqueado)
    document.body.style.overflow = 'auto'; 
}

// Bloqueia o scroll da página enquanto a tela de login estiver aberta
document.addEventListener('DOMContentLoaded', () => {
    document.body.style.overflow = 'hidden';
});

// ==========================================
// LÓGICA DO TEMA DARK / LIGHT
// ==========================================

function toggleTheme() {
    // Alterna a classe 'light-mode' no corpo da página
    document.body.classList.toggle('light-mode');
    
    // Atualiza o texto do botão de acordo com o tema atual
    const btn = document.getElementById('themeToggle');
    if (document.body.classList.contains('light-mode')) {
        btn.innerText = "🌙 Dark Mode";
    } else {
        btn.innerText = "☀️ Light Mode";
    }
}

// ==========================================
// LÓGICA DO PLAYER SOBREPOSTO (MODAL)
// ==========================================

const modal = document.getElementById('videoModal');
const container = document.getElementById('playerContainer');

// Função para abrir um filme (Usa a API myembed.biz discutida anteriormente)
function abrirPlayer(idFilme) {
    modal.classList.add('active'); // Mostra o modal
    // Injeta o iframe dinamicamente baseado no ID passado
    container.innerHTML = `<iframe src="https://myembed.biz/filme/${idFilme}" width="100%" height="500" frameborder="0" allowfullscreen></iframe>`;
}

// Função para abrir uma série (Especificando ID, Temporada e Episódio)
function abrirPlayerSerie(idSerie, temporada, episodio) {
    modal.classList.add('active'); // Mostra o modal
    // Injeta o iframe da série
    container.innerHTML = `<iframe src="https://myembed.biz/serie/${idSerie}/${temporada}/${episodio}" width="100%" height="500" frameborder="0" allowfullscreen></iframe>`;
}

// Função para fechar o player
function fecharPlayer() {
    modal.classList.remove('active'); // Oculta o modal
    container.innerHTML = ''; // Remove o iframe para parar o áudio/vídeo imediatamente
}