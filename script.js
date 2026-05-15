let filmeAbertoID = null;

function mudarAba(aba) {
    const secHome = document.getElementById('home');
    const secFilmes = document.getElementById('filmes');
    const secSeries = document.getElementById('series');
    const secContato = document.getElementById('contato');

    if (aba === 'tudo') {
        secHome.style.display = 'block'; secFilmes.style.display = 'block'; secSeries.style.display = 'block'; secContato.style.display = 'block';
    } else if (aba === 'filmes') {
        secHome.style.display = 'none'; secFilmes.style.display = 'block'; secSeries.style.display = 'none'; secContato.style.display = 'none';
    } else if (aba === 'series') {
        secHome.style.display = 'none'; secFilmes.style.display = 'none'; secSeries.style.display = 'block'; secContato.style.display = 'none';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function filtrarCatalogo() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toLowerCase();
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        const title = card.querySelector('h3').innerText.toLowerCase();
        card.style.display = title.includes(filter) ? "" : "none";
    });
}

function entrarComoConvidado() {
    document.getElementById('authOverlay').classList.remove('active');
    document.body.style.overflow = 'auto'; 
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const btn = document.getElementById('themeToggle');
    btn.innerText = document.body.classList.contains('light-mode') ? "🌙 Dark Mode" : "☀️ Light Mode";
}

function abrirPlayer(idFilme) {
    window.filmeAbertoID = idFilme;
    document.getElementById('videoModal').classList.add('active'); 
    document.getElementById('playerContainer').innerHTML = `<iframe src="https://myembed.biz/filme/${idFilme}" width="100%" height="300" frameborder="0" allowfullscreen></iframe>`;
    document.getElementById('ratingTitle').innerText = "De 1 a 5, como avalia este filme?";
    resetarEstrelas();
    if(window.adicionarViewNoFirebase) window.adicionarViewNoFirebase(idFilme);
}

function abrirPlayerSerie(idSerie, temporada, episodio) {
    window.filmeAbertoID = idSerie;
    document.getElementById('videoModal').classList.add('active'); 
    document.getElementById('playerContainer').innerHTML = `<iframe src="https://myembed.biz/serie/${idSerie}/${temporada}/${episodio}" width="100%" height="300" frameborder="0" allowfullscreen></iframe>`;
    document.getElementById('ratingTitle').innerText = "De 1 a 5, como avalia esta série/anime?";
    resetarEstrelas();
    if(window.adicionarViewNoFirebase) window.adicionarViewNoFirebase(idSerie);
}

// NOVA FUNÇÃO DE TESTE: Link puro sem informar temporada e episódio
function abrirPlayerGeral(id) {
    window.filmeAbertoID = id;
    document.getElementById('videoModal').classList.add('active'); 
    document.getElementById('playerContainer').innerHTML = `<iframe src="https://myembed.biz/serie/${id}" width="100%" height="300" frameborder="0" allowfullscreen></iframe>`;
    document.getElementById('ratingTitle').innerText = "De 1 a 5, como avalia este título?";
    resetarEstrelas();
    if(window.adicionarViewNoFirebase) window.adicionarViewNoFirebase(id);
}

function resetarEstrelas() {
    document.getElementById('ratingMsg').innerText = "";
    document.querySelectorAll('input[name="rating"]').forEach(s => { s.checked = false; s.disabled = false; });
}

function fecharPlayer() {
    document.getElementById('videoModal').classList.remove('active'); 
    document.getElementById('playerContainer').innerHTML = ''; 
}
