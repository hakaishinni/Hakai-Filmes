let filmeAbertoID = null;

function mudarAba(aba) {
    const secHome = document.getElementById('home');
    const secFilmes = document.getElementById('filmes');
    const secSeries = document.getElementById('series');
    const secAnimes = document.getElementById('animes');
    const secContato = document.getElementById('contato');

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

    if (filter !== "") {
        document.getElementById('filmes').style.display = "block";
        document.getElementById('series').style.display = "block";
        document.getElementById('animes').style.display = "block";
    }
}

function entrarComoConvidado() {
    let auth = document.getElementById('authOverlay');
    if(auth) {
        auth.style.display = 'none';
        auth.classList.remove('active');
    }
    document.body.style.overflow = 'auto'; 
}

function registrarView(id) {
    const ref = database.ref('views/' + id);
    ref.once('value').then(snap => {
        let viewsAtuais = snap.val() || 0;
        ref.set(viewsAtuais + 1);
    });
}

function abrirPlayer(idFilme) {
    window.filmeAbertoID = idFilme;
    document.getElementById('playerModal').classList.add('active'); 
    
    document.getElementById('videoContainer').innerHTML = `<iframe src="https://myembed.biz/filme/${idFilme}" width="100%" style="height: 400px;" frameborder="0" allowfullscreen></iframe>`;
    
    const titleEl = document.getElementById('ratingTitle');
    if(titleEl) titleEl.innerText = "De 1 a 5, como avalia este filme?";
    
    resetarEstrelas();
    registrarView(idFilme); 
}

function abrirPlayerSerie(idSerie) {
    window.filmeAbertoID = idSerie;
    document.getElementById('playerModal').classList.add('active'); 
    
    document.getElementById('videoContainer').innerHTML = `<iframe src="https://myembed.biz/serie/${idSerie}" width="100%" style="height: 70vh; min-height: 500px;" frameborder="0" allowfullscreen></iframe>`;
    
    const titleEl = document.getElementById('ratingTitle');
    if(titleEl) titleEl.innerText = "De 1 a 5, como avalia esta série/anime?";
    
    resetarEstrelas();
    registrarView(idSerie); 
}

function resetarEstrelas() {
    const msgEl = document.getElementById('ratingMsg');
    if(msgEl) msgEl.innerText = "";
    
    document.querySelectorAll('input[name="rating"]').forEach(s => { 
        s.checked = false; 
        s.disabled = false; 
    });
}

function fecharPlayer() {
    document.getElementById('playerModal').classList.remove('active'); 
    document.getElementById('videoContainer').innerHTML = ''; 
}

const TMDB_API_KEY = '40a84247b6de679f7ee596d02231aeb0';

function carregarCatalogoDinamicamente() {
    database.ref('catalogo').once('value').then((snapshot) => {
        if (snapshot.exists()) {
            const dados = snapshot.val();
            if (dados.filmes) Object.keys(dados.filmes).forEach(id => puxarDadosTMDB(id, 'carrossel-filmes', 'movie'));
            if (dados.series) Object.keys(dados.series).forEach(id => puxarDadosTMDB(id, 'carrossel-series', 'tv'));
            if (dados.animes) Object.keys(dados.animes).forEach(id => puxarDadosTMDB(id, 'carrossel-animes', 'tv'));
        }
    }).catch(erro => console.error("Erro ao ler catálogo do Firebase:", erro));
}

function puxarDadosTMDB(id, containerId, tipo) {
    const url = `https://api.themoviedb.org/3/${tipo}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`;
    
    fetch(url)
        .then(resposta => resposta.json())
        .then(dados => {
            const titulo = dados.title || dados.name; 
            const poster = `https://image.tmdb.org/t/p/w500${dados.poster_path}`;
            const container = document.getElementById(containerId);
            const card = document.createElement('div');
            card.className = 'card';
            
            if (tipo === 'tv') {
                card.setAttribute('onclick', `abrirPlayerSerie('${id}')`); 
            } else {
                card.setAttribute('onclick', `abrirPlayer('${id}')`); 
            }
            
            card.innerHTML = `
                <img src="${poster}" alt="${titulo}">
                <h3>${titulo}</h3>
                <div class="card-meta">
                    <span>⭐ <span class="star-count" id="star-${id}">0.0</span></span>
                    <span>👁️ <span class="view-count" id="view-${id}">0</span></span>
                </div>
            `;
            
            if (container) container.appendChild(card);
            
            database.ref('views/' + id).on('value', (snap) => {
                if(snap.exists()) {
                    let viewSpan = document.getElementById('view-' + id);
                    if(viewSpan) viewSpan.innerText = snap.val();
                }
            });
            
            database.ref('ratings/' + id).on('value', (snap) => {
                if(snap.exists()) {
                    let total = 0, count = 0;
                    snap.forEach(voto => { total += voto.val(); count++; });
                    let media = (total / count).toFixed(1);
                    let starSpan = document.getElementById('star-' + id);
                    if(starSpan) starSpan.innerText = media;
                }
            });
        })
        .catch(erro => console.error(`Erro ao puxar dados do ID ${id}:`, erro));
}

document.addEventListener('change', function(e) {
    if(e.target.name === 'rating' && window.filmeAbertoID) {
        let nota = parseInt(e.target.value);
        let timestamp = new Date().getTime(); 
        
        database.ref('ratings/' + window.filmeAbertoID + '/' + timestamp).set(nota)
            .then(() => {
                const msgEl = document.getElementById('ratingMsg');
                if(msgEl) msgEl.innerText = "Obrigado por avaliar!";
                document.querySelectorAll('input[name="rating"]').forEach(s => s.disabled = true);
            });
    }
});

window.addEventListener('DOMContentLoaded', carregarCatalogoDinamicamente);
