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
    const ref = database.ref('views/' + id);
    ref.once('value').then(snap => ref.set((snap.val() || 0) + 1));
}

function abrirPlayer(idFilme) { window.filmeAbertoID = idFilme; window.tipoAberto = 'movie'; exibirTelaDetalhes(idFilme, 'movie'); }
function abrirPlayerSerie(idSerie) { window.filmeAbertoID = idSerie; window.tipoAberto = 'tv'; exibirTelaDetalhes(idSerie, 'tv'); }

// ========================================================
// MOTOR MEGA PREMIUM (LOGOS, ELENCO FOTO, TRAILER, SEMELHANTES)
// ========================================================
function exibirTelaDetalhes(id, tipo) {
    document.getElementById('videoView').style.display = 'none';
    document.getElementById('trailerView').style.display = 'none';
    document.getElementById('detailsView').style.display = 'block';
    document.getElementById('videoContainer').innerHTML = ''; 
    document.getElementById('trailerContainer').innerHTML = ''; 
    document.getElementById('playerModal').classList.add('active');

    // MÁGICA: Pede TUDO de uma vez para o TMDB (images, videos, credits, recommendations)
    const extraData = tipo === 'movie' ? 'release_dates,credits,images,videos,recommendations' : 'content_ratings,credits,images,videos,recommendations';
    const url = `https://api.themoviedb.org/3/${tipo}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=${extraData}&include_image_language=pt,en,null`;
    
    fetch(url).then(res => res.json()).then(dados => {
        const titulo = dados.title || dados.name; 
        const backdrop = dados.backdrop_path ? `https://image.tmdb.org/t/p/w780${dados.backdrop_path}` : '';
        const ano = (dados.release_date || dados.first_air_date || '----').split('-')[0];
        
        // 1. BACKDROP
        const backdropEl = document.getElementById('modalBackdrop');
        backdropEl.style.backgroundImage = backdrop ? `url('${backdrop}')` : 'none';

        // 2. LOGO EM PNG OU TEXTO
        const titleContainer = document.getElementById('modalTitleContainer');
        if (dados.images && dados.images.logos && dados.images.logos.length > 0) {
            // Pega o primeiro logo disponível
            const logoPath = dados.images.logos[0].file_path;
            titleContainer.innerHTML = `<img src="https://image.tmdb.org/t/p/w500${logoPath}" class="logo-img" alt="${titulo}">`;
        } else {
            titleContainer.innerHTML = `<h1 id="modalTitle">${titulo}</h1>`;
        }

        document.getElementById('modalOverview').innerText = dados.overview || "Sinopse não disponível para este título.";
        document.getElementById('modalYear').innerText = ano;
        document.getElementById('modalTagline').innerText = dados.tagline ? `"${dados.tagline}"` : '';

        // 3. GÊNEROS E DURAÇÃO
        document.getElementById('modalGenres').innerText = dados.genres?.map(g => g.name).join(' • ') || 'Categoria Desconhecida';
        
        if (tipo === 'tv') {
            const temps = dados.number_of_seasons || '1';
            const eps = dados.number_of_episodes || '?';
            document.getElementById('modalDuration').innerText = `${temps} Temp. (${eps} Episódios)`;
            document.getElementById('ratingTitle').innerText = "Avalie esta série/anime";
        } else {
            const rt = dados.runtime;
            document.getElementById('modalDuration').innerText = rt > 0 ? `${Math.floor(rt / 60)}h ${rt % 60}m` : 'Duração Indisponível';
            document.getElementById('ratingTitle').innerText = "Avalie este filme";
        }

        // 4. CLASSIFICAÇÃO BRASIL
        let ageRating = 'SR', ageColor = '#555', textColor = '#fff', borderStyle = '1px solid transparent';
        if (tipo === 'movie' && dados.release_dates) {
            const br = dados.release_dates.results.find(r => r.iso_3166_1 === 'BR');
            if (br && br.release_dates.length > 0) ageRating = br.release_dates.find(d => d.certification)?.certification || 'SR';
        } else if (tipo === 'tv' && dados.content_ratings) {
            const br = dados.content_ratings.results.find(r => r.iso_3166_1 === 'BR');
            if (br && br.rating) ageRating = br.rating;
        }
        if (ageRating === 'L' || ageRating === 'Livre' || ageRating === '0') { ageRating = 'L'; ageColor = '#0c8b3e'; } 
        else if (ageRating === '10') { ageColor = '#0f7cc0'; } 
        else if (ageRating === '12') { ageColor = '#ffc107'; textColor = '#000'; } 
        else if (ageRating === '14') { ageColor = '#e67822'; } 
        else if (ageRating === '16') { ageColor = '#e50914'; } 
        else if (ageRating === '18') { ageColor = '#000000'; borderStyle = '1px solid #fff'; } 
        else { ageRating = 'SR'; borderStyle = '1px solid #888'; ageColor='transparent'; textColor='#888';} 

        const badge = document.querySelector('.meta-item.age-rating');
        badge.innerText = ageRating; badge.style.backgroundColor = ageColor; badge.style.color = textColor; badge.style.border = borderStyle;

        // 5. FOTOS DO ELENCO (Cast Avatares)
        const castGrid = document.getElementById('modalCastGrid');
        castGrid.innerHTML = '';
        if (dados.credits && dados.credits.cast) {
            const atores = dados.credits.cast.slice(0, 5); // Pega os 5 principais
            atores.forEach(ator => {
                const foto = ator.profile_path ? `https://image.tmdb.org/t/p/w185${ator.profile_path}` : 'https://placehold.co/60x60/222/555?text=Foto';
                castGrid.innerHTML += `
                    <div class="cast-member">
                        <img src="${foto}" alt="${ator.name}">
                        <span>${ator.name.split(' ')[0]}</span>
                    </div>`;
            });
        }
        let criador = tipo === 'tv' ? dados.created_by?.map(c => c.name).join(', ') : dados.credits?.crew?.find(c => c.job === 'Director')?.name;
        document.getElementById('modalCreator').innerText = criador || 'Não informado';

        // 6. TRAILER NO YOUTUBE
        const btnTrailer = document.getElementById('btnTrailer');
        urlTrailerGlobal = null;
        if (dados.videos && dados.videos.results) {
            const trailer = dados.videos.results.find(v => v.site === "YouTube" && v.type === "Trailer");
            if (trailer) {
                urlTrailerGlobal = trailer.key;
                btnTrailer.style.display = 'flex';
                btnTrailer.onclick = abrirTrailer;
            } else { btnTrailer.style.display = 'none'; }
        }

        // 7. TÍTULOS SEMELHANTES
        const similarGrid = document.getElementById('modalSimilarGrid');
        similarGrid.innerHTML = '';
        if (dados.recommendations && dados.recommendations.results) {
            const similares = dados.recommendations.results.slice(0, 6); // Pega 6 semelhantes
            similares.forEach(sim => {
                if(sim.poster_path) {
                    const fnClique = tipo === 'tv' ? `abrirPlayerSerie('${sim.id}')` : `abrirPlayer('${sim.id}')`;
                    similarGrid.innerHTML += `
                        <div class="similar-card" onclick="${fnClique}">
                            <img src="https://image.tmdb.org/t/p/w342${sim.poster_path}">
                        </div>`;
                }
            });
        }

    }).catch(erro => console.error("Erro API:", erro));

    resetarEstrelas(); registrarView(id); 
}

// LÓGICA DOS PLAYERS (FILME/SÉRIE E TRAILER)
function darPlayNoVideo() {
    if (!window.filmeAbertoID) return;
    document.getElementById('detailsView').style.display = 'none';
    document.getElementById('videoView').style.display = 'flex'; 
    let urlEmbed = window.tipoAberto === 'tv' ? `https://myembed.biz/serie/${window.filmeAbertoID}` : `https://myembed.biz/filme/${window.filmeAbertoID}`;
    document.getElementById('videoContainer').innerHTML = `<iframe src="${urlEmbed}" width="100%" height="100%" style="border:none;" allowfullscreen></iframe>`;
}

function abrirTrailer() {
    if(!urlTrailerGlobal) return;
    document.getElementById('detailsView').style.display = 'none';
    document.getElementById('trailerView').style.display = 'flex';
    document.getElementById('trailerContainer').innerHTML = `<iframe src="https://www.youtube.com/embed/${urlTrailerGlobal}?autoplay=1" width="100%" height="100%" style="border:none;" allowfullscreen></iframe>`;
}

function voltarParaDetalhes() {
    document.getElementById('videoView').style.display = 'none'; 
    document.getElementById('trailerView').style.display = 'none'; 
    document.getElementById('detailsView').style.display = 'block';
    document.getElementById('videoContainer').innerHTML = ''; 
    document.getElementById('trailerContainer').innerHTML = ''; 
}

function resetarEstrelas() {
    const msgEl = document.getElementById('ratingMsg'); if(msgEl) msgEl.innerText = "";
    document.querySelectorAll('input[name="rating"]').forEach(s => { s.checked = false; s.disabled = false; });
}
function fecharPlayer() {
    document.getElementById('playerModal').classList.remove('active'); 
    document.getElementById('videoContainer').innerHTML = ''; 
    document.getElementById('trailerContainer').innerHTML = ''; 
}

// ========================================================
// CATÁLOGO: FIREBASE + TENDÊNCIAS TMDB AUTOMÁTICAS
// ========================================================
function carregarCatalogoDinamicamente() {
    database.ref('catalogo').once('value').then((snapshot) => {
        if (snapshot.exists()) {
            const dados = snapshot.val();
            if (dados.filmes) Object.keys(dados.filmes).forEach(id => puxarDadosTMDB(id, 'carrossel-filmes', 'movie'));
            if (dados.series) Object.keys(dados.series).forEach(id => puxarDadosTMDB(id, 'carrossel-series', 'tv'));
            if (dados.animes) Object.keys(dados.animes).forEach(id => puxarDadosTMDB(id, 'carrossel-animes', 'tv'));
        }
    });
}

function puxarTendenciasGerais() {
    // Puxa os Top 10 filmes mais famosos da semana no mundo!
    fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=pt-BR`)
        .then(res => res.json()).then(dados => {
            const container = document.getElementById('carrossel-tendencias');
            dados.results.slice(0, 10).forEach(item => {
                const poster = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
                const card = document.createElement('div');
                card.className = 'card';
                card.setAttribute('onclick', `abrirPlayer('${item.id}')`);
                card.innerHTML = `<img src="${poster}" alt="${item.title}"><h3>${item.title}</h3><div class="card-meta"><span style="color:#e50914; font-weight:bold;">Em Alta</span></div>`;
                container.appendChild(card);
            });
        });
}

function puxarDadosTMDB(id, containerId, tipo) {
    const url = `https://api.themoviedb.org/3/${tipo}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`;
    fetch(url).then(resposta => resposta.json()).then(dados => {
            const titulo = dados.title || dados.name; 
            const poster = `https://image.tmdb.org/t/p/w500${dados.poster_path}`;
            const container = document.getElementById(containerId);
            const card = document.createElement('div');
            card.className = 'card';
            if (tipo === 'tv') card.setAttribute('onclick', `abrirPlayerSerie('${id}')`); else card.setAttribute('onclick', `abrirPlayer('${id}')`);
            card.innerHTML = `<img src="${poster}" alt="${titulo}"><h3>${titulo}</h3><div class="card-meta"><span>⭐ <span id="star-${id}">0.0</span></span><span>👁️ <span id="view-${id}">0</span></span></div>`;
            if (container) container.appendChild(card);
            
            database.ref('views/' + id).on('value', snap => { if(snap.exists()) { let v = document.getElementById('view-' + id); if(v) v.innerText = snap.val(); } });
            database.ref('ratings/' + id).on('value', snap => { if(snap.exists()) { let t = 0, c = 0; snap.forEach(voto => { t += voto.val(); c++; }); let s = document.getElementById('star-' + id); if(s) s.innerText = (t/c).toFixed(1); } });
        });
}

document.addEventListener('change', function(e) {
    if(e.target.name === 'rating' && window.filmeAbertoID) {
        let nota = parseInt(e.target.value); let timestamp = new Date().getTime(); 
        database.ref('ratings/' + window.filmeAbertoID + '/' + timestamp).set(nota).then(() => {
            const msgEl = document.getElementById('ratingMsg'); if(msgEl) msgEl.innerText = "Obrigado por avaliar!";
            document.querySelectorAll('input[name="rating"]').forEach(s => s.disabled = true);
        });
    }
});

window.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', filtrarCatalogo);
    if (localStorage.getItem('hkFilmes_acessoLiberado') === 'true') {
        let auth = document.getElementById('authOverlay');
        if(auth) { auth.style.display = 'none'; auth.classList.remove('active'); }
        document.body.style.overflow = 'auto'; 
    }
    
    // Inicia os motores duplos de catálogo:
    carregarCatalogoDinamicamente(); // Os que você coloca no Firebase
    puxarTendenciasGerais(); // Os que o TMDB alimenta sozinho "Em Alta"
});
