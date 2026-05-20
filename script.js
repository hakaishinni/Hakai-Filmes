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

function registrarView(id) {
    if (localStorage.getItem('hkAdmin') === 'true') return; 
    const ref = database.ref('views/' + id);
    ref.once('value').then(snap => ref.set((snap.val() || 0) + 1));
}

function abrirPlayer(idFilme) { window.filmeAbertoID = idFilme; window.tipoAberto = 'movie'; exibirTelaDetalhes(idFilme, 'movie'); }
function abrirPlayerSerie(idSerie) { window.filmeAbertoID = idSerie; window.tipoAberto = 'tv'; exibirTelaDetalhes(idSerie, 'tv'); }

// --- MODAL E DETALHES (Mantendo igual, pois funcionava) ---
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
        document.getElementById('modalYear').innerText = (dados.release_date || dados.first_air_date || '----').split('-')[0];
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
        // ... (resto da lógica do modal permanece a mesma que você já tem)
    });
    registrarView(id); 
}

// --- CARREGAMENTO DO CATÁLOGO COM CONTADORES E VIEWS ---
function carregarCatalogoDinamicamente() {
    database.ref('catalogo').once('value').then((snapshot) => {
        if (!snapshot.exists()) return;
        const dados = snapshot.val();
        
        if (dados.filmes) {
            injetarContadorNoTitulo('filmes', Object.keys(dados.filmes).length);
            Object.keys(dados.filmes).forEach(id => puxarDadosTMDB(id, 'carrossel-filmes', 'movie'));
        }
        if (dados.series) {
            injetarContadorNoTitulo('series', Object.keys(dados.series).length);
            Object.keys(dados.series).forEach(id => puxarDadosTMDB(id, 'carrossel-series', 'tv'));
        }
        if (dados.animes) {
            injetarContadorNoTitulo('animes', Object.keys(dados.animes).length);
            Object.keys(dados.animes).forEach(id => puxarDadosTMDB(id, 'carrossel-animes', 'tv'));
        }
    });
}

function injetarContadorNoTitulo(sectionId, total) {
    const h2Element = document.querySelector(`#${sectionId} h2`);
    if (h2Element) {
        const antigo = h2Element.querySelector('.badge-contador');
        if (antigo) antigo.remove();
        h2Element.innerHTML += ` <span class="badge-contador" style="background: #222; color: #aaa; font-size: 0.55em; padding: 3px 9px; border-radius: 20px; margin-left: 10px; font-weight: 600; vertical-align: middle; border: 1px solid #333;">${total}</span>`;
    }
}

// --- ESTA É A FUNÇÃO QUE DESSENHA O CARD (COM ESTRELAS E VIEWS) ---
function puxarDadosTMDB(id, containerId, tipo) {
    const url = `https://api.themoviedb.org/3/${tipo}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`;
    fetch(url).then(res => res.json()).then(dados => {
        if (dados.success === false || !dados.id) return; // SILENCIOSO: Se não achar, não faz nada!

        const container = document.getElementById(containerId);
        if (!container) return;
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => (tipo === 'tv' ? abrirPlayerSerie(id) : abrirPlayer(id));
        
        // Aqui estão os elementos de ESTRELAS e VIEWS que você queria de volta
        card.innerHTML = `
            <img src="${dados.poster_path ? 'https://image.tmdb.org/t/p/w500' + dados.poster_path : 'https://placehold.co/500x750/222/FFF?text=Sem+Capa'}">
            <h3>${dados.title || dados.name}</h3>
            <div class="card-meta">
                <span>⭐ <span id="star-${id}">0.0</span></span>
                <span>👁️ <span id="view-${id}">0</span></span>
            </div>
        `;
        container.appendChild(card);
        
        // Ativa os listeners do Firebase para atualizar estrelas e views em tempo real
        database.ref('views/' + id).on('value', snap => { if(snap.exists()) { let v = document.getElementById('view-' + id); if(v) v.innerText = snap.val(); } });
        database.ref('ratings/' + id).on('value', snap => { if(snap.exists()) { let t = 0, c = 0; snap.forEach(voto => { t += voto.val(); c++; }); let s = document.getElementById('star-' + id); if(s) s.innerText = (t/c).toFixed(1); } });
    }).catch(() => {}); // O catch vazio garante que o erro não pare a fila
}

// --- RESTO DO CÓDIGO (MANTER IGUAL) ---
function puxarTendenciasGerais() {
    fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=pt-BR`)
        .then(res => res.json()).then(d => {
            const container = document.getElementById('carrossel-tendencias');
            if(!container) return;
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
        if(msg) {
            msg.innerText = "✓ Chave PIX copiada!";
            setTimeout(() => { msg.innerText = ""; }, 3000);
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    puxarTendenciasGerais();
    carregarCatalogoDinamicamente();
});
