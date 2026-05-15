// ==========================================
// SISTEMA DE ABAS (NAVEGAÇÃO)
// ==========================================
function mudarAba(aba) {
    const secHome = document.getElementById('home');
    const secFilmes = document.getElementById('filmes');
    const secSeries = document.getElementById('series');
    const secContato = document.getElementById('contato');

    if (aba === 'tudo') {
        secHome.style.display = 'flex';
        secFilmes.style.display = 'block';
        secSeries.style.display = 'block';
        secContato.style.display = 'block';
    } else if (aba === 'filmes') {
        secHome.style.display = 'none';
        secFilmes.style.display = 'block';
        secSeries.style.display = 'none';
        secContato.style.display = 'none';
    } else if (aba === 'series') {
        secHome.style.display = 'none';
        secFilmes.style.display = 'none';
        secSeries.style.display = 'block';
        secContato.style.display = 'none';
    }
    
    // Rola a tela suavemente para o topo ao trocar de aba
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// LÓGICA DE LOGIN / CONVIDADO
// ==========================================
function entrarComoConvidado() {
    const overlay = document.getElementById('authOverlay');
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto'; 
}

document.addEventListener('DOMContentLoaded', () => {
    document.body.style.overflow = 'hidden';
});

// ==========================================
// LÓGICA DO TEMA DARK / LIGHT
// ==========================================
function toggleTheme() {
    document.body.classList.toggle('light-mode');
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

// Função para abrir um filme
function abrirPlayer(idFilme) {
    modal.classList.add('active'); 
    container.innerHTML = `<iframe src="https://myembed.biz/filme/${idFilme}" width="100%" height="500" frameborder="0" allowfullscreen></iframe>`;
    
    // INJETADO: SOMA +1 VIEW NO FIREBASE AO ABRIR
    if(window.adicionarViewNoFirebase) {
        window.adicionarViewNoFirebase(idFilme);
    }
}

// Função para abrir uma série
function abrirPlayerSerie(idSerie, temporada, episodio) {
    modal.classList.add('active'); 
    container.innerHTML = `<iframe src="https://myembed.biz/serie/${idSerie}/${temporada}/${episodio}" width="100%" height="500" frameborder="0" allowfullscreen></iframe>`;
    
    // INJETADO: SOMA +1 VIEW NO FIREBASE AO ABRIR
    if(window.adicionarViewNoFirebase) {
        window.adicionarViewNoFirebase(idSerie);
    }
}

// Função para fechar o player
function fecharPlayer() {
    modal.classList.remove('active'); 
    container.innerHTML = ''; 
}
