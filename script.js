let filmeAbertoID = null;

function mudarAba(aba) {
    const secHome = document.getElementById('home');
    const secFilmes = document.getElementById('filmes');
    const secSeries = document.getElementById('series');
    if (aba === 'tudo') {
        secHome.style.display = 'flex'; secFilmes.style.display = 'block'; secSeries.style.display = 'block';
    } else if (aba === 'filmes') {
        secHome.style.display = 'none'; secFilmes.style.display = 'block'; secSeries.style.display = 'none';
    } else if (aba === 'series') {
        secHome.style.display = 'none'; secFilmes.style.display = 'none'; secSeries.style.display = 'block';
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
    if (filter !== "") {
        document.getElementById('filmes').style.display = "block";
        document.getElementById('series').style.display = "block";
    }
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
    document.getElementById('playerContainer').innerHTML = `<iframe src="https://myembed.biz/filme/${idFilme}" width="100%" height="350" frameborder="0" allowfullscreen></iframe>`;
    document.getElementById('ratingTitle').innerText = "De 1 a 5, como avalia este filme?";
    document.getElementById('ratingMsg').innerText = "";
    resetarEstrelas();
    if(window.adicionarViewNoFirebase) window.adicionarViewNoFirebase(idFilme);
}

function abrirPlayerSerie(idSerie, temporada, episodio) {
    window.filmeAbertoID = idSerie;
    document.getElementById('videoModal').classList.add('active'); 
    document.getElementById('playerContainer').innerHTML = `<iframe src="https://myembed.biz/serie/${idSerie}/${temporada}/${episodio}" width="100%" height="350" frameborder="0" allowfullscreen></iframe>`;
    document.getElementById('ratingTitle').innerText = "De 1 a 5, como avalia esta série/anime?";
    document.getElementById('ratingMsg').innerText = "";
    resetarEstrelas();
    if(window.adicionarViewNoFirebase) window.adicionarViewNoFirebase(idSerie);
}

function resetarEstrelas() {
    document.querySelectorAll('input[name="rating"]').forEach(s => { s.checked = false; s.disabled = false; });
}

function fecharPlayer() {
    document.getElementById('videoModal').classList.remove('active'); 
    document.getElementById('playerContainer').innerHTML = ''; 
}
