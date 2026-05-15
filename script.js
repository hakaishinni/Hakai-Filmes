let filmeAbertoID = null;

function mudarAba(aba) {
    const secHome = document.getElementById('home');
    const secFilmes = document.getElementById('filmes');
    const secSeries = document.getElementById('series');
    const secAnimes = document.getElementById('animes');
    const secContato = document.getElementById('contato');

    // Lógica para esconder ou mostrar as seções corretas
    secHome.style.display = (aba === 'tudo') ? 'block' : 'none';
    secFilmes.style.display = (aba === 'tudo' || aba === 'filmes') ? 'block' : 'none';
    secSeries.style.display = (aba === 'tudo' || aba === 'series') ? 'block' : 'none';
    secAnimes.style.display = (aba === 'tudo' || aba === 'animes') ? 'block' : 'none';
    secContato.style.display = (aba === 'tudo') ? 'block' : 'none';
    
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

    // Se estiver pesquisando, força mostrar todas as seções para a pessoa ver o resultado
    if (filter !== "") {
        document.getElementById('filmes').style.display = "block";
        document.getElementById('series').style.display = "block";
        document.getElementById('animes').style.display = "block";
    }
}

function entrarComoConvidado() {
    document.getElementById('authOverlay').classList.remove('active');
    document.body.style.overflow = 'auto'; 
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const btn = document.getElementById('themeToggle');
    btn.innerText = document.body.classList.contains('light-mode') ? "🌙 Dark" : "☀️ Light";
}

function abrirPlayer(idFilme) {
    window.filmeAbertoID = idFilme;
    document.getElementById('videoModal').classList.add('active'); 
    
    document.getElementById('playerContainer').innerHTML = `<iframe src="https://myembed.biz/filme/${idFilme}" width="100%" style="height: 400px;" frameborder="0" allowfullscreen></iframe>`;
    
    document.getElementById('ratingTitle').innerText = "De 1 a 5, como avalia este filme?";
    resetarEstrelas();
    if(window.adicionarViewNoFirebase) window.adicionarViewNoFirebase(idFilme);
}

function abrirPlayerSerie(idSerie) {
    window.filmeAbertoID = idSerie;
    document.getElementById('videoModal').classList.add('active'); 
    
    document.getElementById('playerContainer').innerHTML = `<iframe src="https://myembed.biz/serie/${idSerie}" width="100%" style="height: 70vh; min-height: 500px;" frameborder="0" allowfullscreen></iframe>`;
    
    // A frase continua valendo para Séries E Animes!
    document.getElementById('ratingTitle').innerText = "De 1 a 5, como avalia esta série/anime?";
    resetarEstrelas();
    if(window.adicionarViewNoFirebase) window.adicionarViewNoFirebase(idSerie);
}

function resetarEstrelas() {
    document.getElementById('ratingMsg').innerText = "";
    document.querySelectorAll('input[name="rating"]').forEach(s => { s.checked = false; s.disabled = false; });
}

function fecharPlayer() {
    document.getElementById('videoModal').classList.remove('active'); 
    document.getElementById('playerContainer').innerHTML = ''; 
}
