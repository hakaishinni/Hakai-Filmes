let filmeAbertoID = null;
let tipoAberto = null; 
let urlTrailerGlobal = null;
const TMDB_API_KEY = '40a84247b6de679f7ee596d02231aeb0';

function mudarAba(aba) {
    document.getElementById('home').style.display = (aba === 'tudo') ? 'block' : 'none';
    document.getElementById('tendencias').style.display = (aba === 'tudo') ? 'block' : 'none';
    document.getElementById('filmes').style.display = (aba === 'tudo' || aba === 'filmes') ? 'block' : 'none';
    document.getElementById('series').style.display = (aba === 'tudo' || aba === 'series') ? 'block' : 'none';
    document.getElementById('animes').style.display = (aba === 'tudo' || aba === 'animes') ? 'block' : 'none';
    document.getElementById('contato').style.display = (aba === 'tudo') ? 'block' : 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function filtrarCatalogo() {
    const filter = document.getElementById('searchInput').value.toLowerCase();
    document.querySelectorAll('.card').forEach(card => {
        const titleEl = card.querySelector('h3');
        if (titleEl) card.style.display = titleEl.innerText.toLowerCase().includes(filter) ? "" : "none";
    });
    if (filter !== "") {
        document.getElementById('filmes').style.display = "block";
        document.getElementById('series').style.display = "block";
        document.getElementById('animes').style.display = "block";
        document.getElementById('tendencias').style.display = "none";
    } else { mudarAba('tudo'); }
}

function entrarComoConvidado() {
    let auth = document.getElementById('authOverlay');
    if(auth) { auth.style.display = 'none'; auth.classList.remove('active'); }
    document.body.style.overflow = 'auto'; 
    localStorage.setItem('hkFilmes_acessoLiberado', 'true');
}

function abrirPlayer(idFilme) { window.filmeAbertoID = idFilme; window.tipoAberto = 'movie'; exibirTelaDetalhes(idFilme, 'movie'); }
function abrirPlayerSerie(idSerie) { window.filmeAbertoID = idSerie; window.tipoAberto = 'tv'; exibirTelaDetalhes(idSerie, 'tv'); }

function exibirTelaDetalhes(id, tipo) {
    document.getElementById('videoView').style.display = 'none';
    document.getElementById('trailerView').style.display = 'none';
    document.getElementById('detailsView').style.display = 'block';
    document.getElementById('videoContainer').innerHTML = ''; 
    document.getElementById('trailerContainer').innerHTML = ''; 
    document.getElementById('playerModal').classList.add('active');

    const extraData = tipo === 'movie' ? 'release_dates,credits,images,videos,recommendations' : 'content_ratings,credits,images,videos,recommendations';
    const url = `https://api.themoviedb.org/3/${tipo}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=${extraData}&include_image_language=pt,en,null`;
    
    fetch(url).then(res => res.json()).then(dados => {
        const titulo = dados.title || dados.name; 
        const backdrop = dados.backdrop_path ? `https://image.tmdb.org/t/p/w780${dados.backdrop_path}` : '';
        const ano = (dados.release_date || dados.first_air_date || '----').split('-')[0];
        
        const backdropEl = document.getElementById('modalBackdrop');
        backdropEl.style.backgroundImage = backdrop ? `url('${backdrop}')` : 'none';

        const titleContainer = document.getElementById('modalTitleContainer');
        if (dados.images && dados.images.logos && dados.images.logos.length > 0) {
            const logoPath = dados.images.logos[0].file_path;
            titleContainer.innerHTML = `<img src="https://image.tmdb.org/t/p/w500${logoPath}" class="logo-img" alt="${titulo}">`;
        } else {
            titleContainer.innerHTML = `<h1 id="modalTitle">${titulo}</h1>`;
        }

        document.getElementById('modalOverview').innerText = dados.overview || "Sinopse não disponível.";
        document.getElementById('modalYear').innerText = ano;
        document.getElementById('modalGenres').innerText = dados.genres?.map(g => g.name).join(' • ') || 'Categoria Desconhecida';
        
        const btnTrailer = document.getElementById('btnTrailer');
        if (dados.videos && dados.videos.results) {
            const trailer = dados.videos.results.find(v => v.site === "YouTube" && v.type === "Trailer");
            if (trailer) {
                urlTrailerGlobal = trailer.key;
                btnTrailer.style.display = 'flex';
                btnTrailer.onclick = abrirTrailer;
            } else { btnTrailer.style.display = 'none'; }
        }

        const similarGrid = document.getElementById('modalSimilarGrid');
        similarGrid.innerHTML = '';
        if (dados.recommendations && dados.recommendations.results) {
            dados.recommendations.results.slice(0, 10).forEach(sim => {
                if(sim.poster_path) {
                    const fnClique = tipo === 'tv' ? `abrirPlayerSerie('${sim.id}')` : `abrirPlayer('${sim.id}')`;
                    similarGrid.innerHTML += `<div class="similar-card" onclick="${fnClique}"><img src="https://image.tmdb.org/t/p/w342${sim.poster_path}"></div>`;
                }
            });
            document.getElementById('similarSection').style.display = dados.recommendations.results.length > 0 ? 'block' : 'none';
        }
    }).catch(e => console.error(e));
}

function darPlayNoVideo() {
    if (!window.filmeAbertoID) return;
    document.getElementById('detailsView').style.display = 'none';
    document.getElementById('videoView').style.display = 'flex'; 
    let urlEmbed = window.tipoAberto === 'tv' ? `https://myembed.biz/serie/${window.filmeAbertoID}` : `https://myembed.biz/filme/${window.filmeAbertoID}`;
    document.getElementById('videoContainer').innerHTML = `<div style="position: relative; width: 100%; height: 100%; background: #000; overflow: hidden;"><iframe src="${urlEmbed}" width="100%" height="100%" style="border:none;" allowfullscreen></iframe><button onclick="alert('🍿 Player VIP HK Filmes Ativado!')" style="position: absolute; top: 10px; right: 10px; background: #08080a; color: #e50914; border: 2px solid #e50914; padding: 10px 30px; font-weight: 800; border-radius: 8px; z-index: 50; cursor: pointer;">HK FILMES</button></div>`;
}

function abrirTrailer() {
    document.getElementById('detailsView').style.display = 'none';
    document.getElementById('trailerView').style.display = 'flex';
    document.getElementById('trailerContainer').innerHTML = `<iframe src="https://www.youtube.com/embed/${urlTrailerGlobal}?autoplay=1" width="100%" height="100%" style="border:none;" allowfullscreen></iframe>`;
}

function voltarParaDetalhes() {
    document.getElementById('videoView').style.display = 'none'; 
    document.getElementById('trailerView').style.display = 'none'; 
    document.getElementById('detailsView').style.display = 'block';
}

function fecharPlayer() {
    document.getElementById('playerModal').classList.remove('active'); 
    document.getElementById('videoContainer').innerHTML = ''; 
    document.getElementById('trailerContainer').innerHTML = ''; 
}

function carregarCatalogoDinamicamente() {
    database.ref('catalogo').once('value').then((snapshot) => {
        if (!snapshot.exists()) return;
        const dados = snapshot.val();
        let fila = [];
        if (dados.filmes) Object.keys(dados.filmes).forEach(id => fila.push({id, cont: 'carrossel-filmes', tipo: 'movie'}));
        if (dados.series) Object.keys(dados.series).forEach(id => fila.push({id, cont: 'carrossel-series', tipo: 'tv'}));
        if (dados.animes) Object.keys(dados.animes).forEach(id => fila.push({id, cont: 'carrossel-animes', tipo: 'tv'}));

        let i = 0;
        function rodarFila() {
            if (i >= fila.length) return;
            const lote = fila.slice(i, i + 15);
            lote.forEach(item => puxarDados(item.id, item.cont, item.tipo));
            i += 15;
            setTimeout(rodarFila, 600);
        }
        rodarFila();
    });
}

function puxarDados(id, cont, tipo) {
    fetch(`https://api.themoviedb.org/3/${tipo}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`)
        .then(res => res.json()).then(d => {
            if (d.success === false || !d.id) return;
            const container = document.getElementById(cont);
            const card = document.createElement('div');
            card.className = 'card';
            card.onclick = () => (tipo === 'tv' ? abrirPlayerSerie(id) : abrirPlayer(id));
            card.innerHTML = `<img src="${d.poster_path ? 'https://image.tmdb.org/t/p/w500' + d.poster_path : 'https://placehold.co/500x750/222/FFF?text=Sem+Capa'}"><h3>${d.title || d.name}</h3>`;
            container.appendChild(card);
        }).catch(() => {});
}

function puxarTendenciasGerais() {
    fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=pt-BR`)
        .then(res => res.json()).then(d => {
            const container = document.getElementById('carrossel-tendencias');
            d.results.slice(0, 10).forEach(item => {
                const card = document.createElement('div');
                card.className = 'card';
                card.onclick = () => abrirPlayer(item.id);
                card.innerHTML = `<img src="https://image.tmdb.org/t/p/w500${item.poster_path}"><h3>${item.title}</h3><div class="card-meta"><span style="color:#e50914; font-weight:bold;">Em Alta</span></div>`;
                container.appendChild(card);
            });
        });
}

function copiarChavePix() {
    navigator.clipboard.writeText("ba714471-1484-4618-a070-4a991de0395d").then(() => {
        const msg = document.getElementById('pixStatusMsg');
        msg.innerText = "✓ Chave PIX copiada!";
        setTimeout(() => { msg.innerText = ""; }, 3000);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    puxarTendenciasGerais();
    carregarCatalogoDinamicamente();
});
