// ==========================================
// VARIÁVEIS GLOBAIS
// ==========================================
let filmeAbertoID = null; // Guarda o ID do filme para a avaliação

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
    window.filmeAbertoID = idFilme; // "Anota" o ID para o Firebase
    modal.classList.add('active'); 
    
    // Altura ajustada para 350 para as estrelas aparecerem embaixo no celular
    container.innerHTML = `<iframe src="https://myembed.biz/filme/${idFilme}" width="100%" height="350" frameborder="0" allowfullscreen></iframe>`;
    
    // Reseta o visual da avaliação para o próximo filme
    document.getElementById('ratingMsg').innerText = "";
    resetarEstrelas();

    if(window.adicionarViewNoFirebase) {
        window.adicionarViewNoFirebase(idFilme);
    }
}

// Função para abrir uma série
function abrirPlayerSerie(idSerie, temporada, episodio) {
    window.filmeAbertoID = idSerie; // "Anota" o ID
    modal.classList.add('active'); 
    container.innerHTML = `<iframe src="https://myembed.biz/serie/${idSerie}/${temporada}/${episodio}" width="100%" height="350" frameborder="0" allowfullscreen></iframe>`;
    
    document.getElementById('ratingMsg').innerText = "";
    resetarEstrelas();

    if(window.adicionarViewNoFirebase) {
        window.adicionarViewNoFirebase(idSerie);
    }
}

// Função para limpar a seleção de estrelas anterior
function resetarEstrelas() {
    document.querySelectorAll('input[name="rating"]').forEach(s => {
        s.checked = false;
        s.disabled = false;
    });
}

// Função para fechar o player
function fecharPlayer() {
    modal.classList.remove('active'); 
    container.innerHTML = ''; 
    window.filmeAbertoID = null; // Limpa o ID ao fechar
}
