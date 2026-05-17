let filmeAbertoID = null;
let tipoAberto = null; 

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
        const titleEl = card.querySelector('h3');
        if (titleEl) {
            const title = titleEl.innerText.toLowerCase();
            card.style.display = title.includes(filter) ? "" : "none";
        }
    });
    if (filter !== "") {
        document.getElementById('filmes').style.display = "block";
        document.getElementById('series').style.display = "block";
        document.getElementById('animes').style.display = "block";
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
    ref.once('value').then(snap => {
        let viewsAtuais = snap.val() || 0;
        ref.set(viewsAtuais + 1);
    });
}

function abrirPlayer(idFilme) {
    window.filmeAbertoID = idFilme; window.tipoAberto = 'movie';
    exibirTelaDetalhes(idFilme, 'movie');
}

function abrirPlayerSerie(idSerie) {
    window.filmeAbertoID = idSerie; window.tipoAberto = 'tv';
    exibirTelaDetalhes(idSerie, 'tv');
}

function exibirTelaDetalhes(id, tipo) {
    document.getElementById('videoView').style.display = 'none';
    document.getElementById('detailsView').style.display = 'block';
    document.getElementById('videoContainer').innerHTML = ''; 
    document.getElementById('playerModal').classList.add('active');

    const extraData = tipo === 'movie' ? 'release_dates,credits' : 'content_ratings,credits';
    const url = `https://api.themoviedb.org/3/${tipo}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=${extraData}`;
    
    fetch(url)
        .then(res => res.json())
        .then(dados => {
            const titulo = dados.title || dados.name; 
            const backdrop = dados.backdrop_path ? `https://image.tmdb.org/t/p/w780${dados.backdrop_path}` : '';
            const ano = (dados.release_date || dados.first_air_date || '----').split('-')[0];
            
            document.getElementById('modalTitle').innerText = titulo;
            document.getElementById('modalOverview').innerText = dados.overview || "Sinopse não disponível para este título.";
            document.getElementById('modalYear').innerText = ano;
            
            const generos = dados.genres && dados.genres.length > 0 
                ? dados.genres.map(g => g.name).join(' • ') 
                : 'Categoria Desconhecida';
            document.getElementById('modalGenres').innerText = generos;

            const elenco = dados.credits && dados.credits.cast && dados.credits.cast.length > 0 
                ? dados.credits.cast.slice(0, 4).map(a => a.name).join(', ') 
                : 'Não informado';
            document.getElementById('modalCast').innerText = elenco;

            let criador = 'Não informado';
            if (tipo === 'tv' && dados.created_by && dados.created_by.length > 0) {
                criador = dados.created_by.map(c => c.name).join(', ');
            } else if (tipo === 'movie' && dados.credits && dados.credits.crew) {
                const diretor = dados.credits.crew.find(c => c.job === 'Director' || c.job === 'Diretor');
                if (diretor) criador = diretor.name;
            }
            document.getElementById('modalCreator').innerText = criador;
            
            let ageRating = 'SR'; 
            if (tipo === 'movie' && dados.release_dates) {
                const brRelease = dados.release_dates.results.find(r => r.iso_3166_1 === 'BR');
                if (brRelease && brRelease.release_dates.length > 0) {
                    let cert = brRelease.release_dates.find(d => d.certification !== '');
                    if (cert) ageRating = cert.certification;
                }
            } else if (tipo === 'tv' && dados.content_ratings) {
                const brRating = dados.content_ratings.results.find(r => r.iso_3166_1 === 'BR');
                if (brRating && brRating.rating) ageRating = brRating.rating;
            }

            let ageColor = '#555'; let textColor = '#fff'; let borderStyle = '1px solid transparent';
            if (ageRating === 'L' || ageRating === 'Livre' || ageRating === '0') { ageRating = 'L'; ageColor = '#0c8b3e'; 
            } else if (ageRating === '10') { ageColor = '#0f7cc0'; 
            } else if (ageRating === '12') { ageColor = '#ffc107'; textColor = '#000'; 
            } else if (ageRating === '14') { ageColor = '#e67822'; 
            } else if (ageRating === '16') { ageColor = '#e50914'; 
            } else if (ageRating === '18') { ageColor = '#000000'; borderStyle = '1px solid #fff'; 
            } else { ageRating = 'SR'; borderStyle = '1px solid #888'; background = 'transparent'; color='#888';} 

            const ratingBadge = document.querySelector('.meta-item.age-rating');
            ratingBadge.innerText = ageRating; ratingBadge.style.backgroundColor = ageColor;
            ratingBadge.style.color = textColor; ratingBadge.style.border = borderStyle;

            if (tipo === 'tv') {
                const temporadas = dados.number_of_seasons || '1';
                let txtTempo = temporadas + (temporadas > 1 ? " Temporadas" : " Temporada");
                if (dados.episode_run_time && dados.episode_run_time.length > 0) {
                    txtTempo += ` (${dados.episode_run_time[0]}m por ep.)`;
                }
                document.getElementById('modalDuration').innerText = txtTempo;
                document.getElementById('ratingTitle').innerText = "De 1 a 5, como avalia esta série/anime?";
            } else {
                const runtime = dados.runtime;
                if (runtime && runtime > 0) {
                    document.getElementById('modalDuration').innerText = `${Math.floor(runtime / 60)}h ${runtime % 60}m`;
                } else {
                    document.getElementById('modalDuration').innerText = 'Duração Indisponível';
                }
                document.getElementById('ratingTitle').innerText = "De 1 a 5, como avalia este filme?";
            }

            const backdropEl = document.getElementById('modalBackdrop');
            if (backdrop) { backdropEl.style.backgroundImage = `url('${backdrop}')`;
            } else { backdropEl.style.backgroundImage = 'none'; }
        })
        .catch(erro => console.error("Erro ao puxar detalhes da API:", erro));

    resetarEstrelas(); registrarView(id); 
}

// === LÓGICA DO PLAYER ESTICADO (FLEX) ===
function darPlayNoVideo() {
    const id = window.filmeAbertoID; const tipo = window.tipoAberto; if (!id) return;
    
    document.getElementById('detailsView').style.display = 'none';
    document.getElementById('videoView').style.display = 'flex'; // Exibe em modo Flexível
    
    let urlEmbed = tipo === 'tv' ? `https://myembed.biz/serie/${id}` : `https://myembed.biz/filme/${id}`;
    
    // O Iframe agora tem height="100%" para aproveitar o Flex
    document.getElementById('videoContainer').innerHTML = `<iframe src="${urlEmbed}" width="100%" height="100%" style="border:none;" allowfullscreen></iframe>`;
}

function voltarParaDetalhes() {
    document.getElementById('videoView').style.display = 'none'; document.getElementById('detailsView').style.display = 'block';
    document.getElementById('videoContainer').innerHTML = ''; 
}

function resetarEstrelas() {
    const msgEl = document.getElementById('ratingMsg'); if(msgEl) msgEl.innerText = "";
    document.querySelectorAll('input[name="rating"]').forEach(s => { s.checked = false; s.disabled = false; });
}

function fecharPlayer() {
    document.getElementById('playerModal').classList.remove('active'); document.getElementById('videoContainer').innerHTML = ''; 
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
    fetch(url).then(resposta => resposta.json()).then(dados => {
            const titulo = dados.title || dados.name; 
            const poster = `https://image.tmdb.org/t/p/w500${dados.poster_path}`;
            const container = document.getElementById(containerId);
            const card = document.createElement('div');
            card.className = 'card';
            if (tipo === 'tv') { card.setAttribute('onclick', `abrirPlayerSerie('${id}')`); } else { card.setAttribute('onclick', `abrirPlayer('${id}')`); }
            card.innerHTML = `<img src="${poster}" alt="${titulo}"><h3>${titulo}</h3><div class="card-meta"><span>⭐ <span class="star-count" id="star-${id}">0.0</span></span><span>👁️ <span class="view-count" id="view-${id}">0</span></span></div>`;
            if (container) container.appendChild(card);
            
            database.ref('views/' + id).on('value', (snap) => { if(snap.exists()) { let viewSpan = document.getElementById('view-' + id); if(viewSpan) viewSpan.innerText = snap.val(); } });
            database.ref('ratings/' + id).on('value', (snap) => { if(snap.exists()) { let total = 0, count = 0; snap.forEach(voto => { total += voto.val(); count++; }); let media = (total / count).toFixed(1); let starSpan = document.getElementById('star-' + id); if(starSpan) starSpan.innerText = media; } });
        }).catch(erro => console.error(`Erro ao puxar dados do ID ${id}:`, erro));
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
    carregarCatalogoDinamicamente();
});
