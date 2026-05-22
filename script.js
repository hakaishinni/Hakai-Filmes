let filmeAbertoID = null;
let tipoAberto = null; 
let tipoTrackingGlobal = null;
let urlTrailerGlobal = null;
const TMDB_API_KEY = '40a84247b6de679f7ee596d02231aeb0';
const auth = firebase.auth(); 

const avatarUrls = {
    gojo: "https://raw.githubusercontent.com/hakaishinni/Hakai-Filmes/main/gojo.jpg",
    ninja: "https://raw.githubusercontent.com/hakaishinni/Hakai-Filmes/main/ninja.jpg",
    vampiro: "https://raw.githubusercontent.com/hakaishinni/Hakai-Filmes/main/vampiro.jpg",
    heroi: "https://raw.githubusercontent.com/hakaishinni/Hakai-Filmes/main/heroi.jpg"
};

// === OBSERVADOR DE LOGIN ===
auth.onAuthStateChanged((user) => {
    const authTela = document.getElementById('authOverlay');
    const headerProfile = document.getElementById('userHeaderProfile');
    const guestProfile = document.getElementById('guestHeaderProfile');
    const headerAvatar = document.getElementById('userHeaderAvatar');

    if (user) {
        if(authTela) { authTela.style.display = 'none'; authTela.classList.remove('active'); }
        document.body.style.overflow = 'auto';

        database.ref('usuarios/' + user.uid).once('value').then((snap) => {
            if (snap.exists() && headerAvatar && headerProfile) {
                const dados = snap.val();
                const escolha = dados.avatar || 'gojo';
                headerAvatar.src = avatarUrls[escolha];
                headerProfile.style.display = 'flex';
                if (guestProfile) guestProfile.style.display = 'none';
            }
        });
    } else {
        if (localStorage.getItem('hkFilmes_acessoLiberado') !== 'true') {
            if(authTela) { authTela.style.display = 'flex'; authTela.classList.add('active'); }
            document.body.style.overflow = 'hidden';
        }
        if (headerProfile) headerProfile.style.display = 'none';
        if (guestProfile) guestProfile.style.display = 'flex';
    }
});

function fazerLogout() {
    auth.signOut().then(() => {
        localStorage.removeItem('hkFilmes_acessoLiberado');
        window.location.reload(); 
    });
}

function abrirTelaLogin() {
    const authTela = document.getElementById('authOverlay');
    if(authTela) { authTela.style.display = 'flex'; authTela.classList.add('active'); }
    document.body.style.overflow = 'hidden';
    alternarTelaAuth('login');
}

function alternarTelaAuth(tela) {
    document.getElementById('loginView').style.display = tela === 'login' ? 'block' : 'none';
    document.getElementById('registroView').style.display = tela === 'registro' ? 'block' : 'none';
}

function mudarAba(aba) {
    document.getElementById('home').style.display = (aba === 'tudo') ? 'block' : 'none';
    document.getElementById('tendencias').style.display = (aba === 'tudo') ? 'block' : 'none';
    document.getElementById('filmes').style.display = (aba === 'tudo' || aba === 'filmes') ? 'block' : 'none';
    document.getElementById('series').style.display = (aba === 'tudo' || aba === 'series') ? 'block' : 'none';
    document.getElementById('animes').style.display = (aba === 'tudo' || aba === 'animes') ? 'block' : 'none';
    document.getElementById('contato').style.display = (aba === 'tudo') ? 'block' : 'none';
    
    // Esconder a pesquisa se mudar de aba
    let areaBusca = document.getElementById('area-resultados-busca');
    if(areaBusca) areaBusca.style.display = 'none';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function entrarComoConvidado() {
    let authTela = document.getElementById('authOverlay');
    if(authTela) { authTela.style.display = 'none'; authTela.classList.remove('active'); }
    document.body.style.overflow = 'auto'; 
    localStorage.setItem('hkFilmes_acessoLiberado', 'true');
    const guestProfile = document.getElementById('guestHeaderProfile');
    if (guestProfile) guestProfile.style.display = 'flex';
}

// ========================================================
// 🔎 NOVO MOTOR DE PESQUISA GLOBAL (TMDB API)
// ========================================================
let tempoDigitacao = null;

function filtrarCatalogo() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    clearTimeout(tempoDigitacao);

    let areaBusca = document.getElementById('area-resultados-busca');
    if (!areaBusca) {
        areaBusca = document.createElement('section');
        areaBusca.id = 'area-resultados-busca';
        areaBusca.className = 'catalog-section';
        areaBusca.style.maxWidth = '1200px';
        areaBusca.style.margin = '0 auto';
        areaBusca.style.padding = '20px';
        document.getElementById('home').insertAdjacentElement('afterend', areaBusca);
    }

    if (query.length < 2) {
        document.getElementById('tendencias').style.display = 'block';
        document.getElementById('filmes').style.display = 'block';
        document.getElementById('series').style.display = 'block';
        document.getElementById('animes').style.display = 'block';
        areaBusca.style.display = 'none';
        return;
    }

    // Esconde a vitrine inicial e mostra a pesquisa
    document.getElementById('tendencias').style.display = 'none';
    document.getElementById('filmes').style.display = 'none';
    document.getElementById('series').style.display = 'none';
    document.getElementById('animes').style.display = 'none';
    areaBusca.style.display = 'block';

    tempoDigitacao = setTimeout(() => {
        areaBusca.innerHTML = `<h2 style="border-left: 4px solid #e50914; padding-left: 10px; margin-bottom: 20px;">Buscando resultados globais...</h2><div id="grid-busca" style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;"></div>`;
        
        fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}&page=1`)
        .then(res => res.json())
        .then(dados => {
            const gridBusca = document.getElementById('grid-busca');
            const resultados = dados.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
            
            if (resultados.length === 0) {
                areaBusca.innerHTML = `<h2 style="border-left: 4px solid #e50914; padding-left: 10px; margin-bottom: 20px;">Nenhum título encontrado.</h2>`;
                return;
            }

            areaBusca.innerHTML = `<h2 style="border-left: 4px solid #e50914; padding-left: 10px; margin-bottom: 20px;">Encontrados para "${query}"</h2><div id="grid-busca" style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;"></div>`;
            const novoGrid = document.getElementById('grid-busca');

            resultados.forEach(item => {
                let title = item.title || item.name;
                let poster = item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : 'https://placehold.co/342x513/222/FFF?text=Sem+Capa';
                
                let tipoTracking = item.media_type;
                if(item.media_type === 'tv' && item.origin_country?.includes('JP')) tipoTracking = 'anime';

                const card = document.createElement('div');
                card.className = 'card';
                card.style.flex = '0 0 auto';
                card.setAttribute('onclick', `abrirPlayerGeral('${item.id}', '${item.media_type}', '${tipoTracking}')`);
                card.innerHTML = `<img src="${poster}" alt="${title}"><h3>${title}</h3>`;
                novoGrid.appendChild(card);
            });
        });
    }, 600); // Aguarda meio segundo após a pessoa parar de digitar para não travar
}

function registrarView(id, tipoTracking) {
    if (localStorage.getItem('hkAdmin') === 'true') return; 
    const ref = database.ref('views/' + tipoTracking + '/' + id);
    ref.once('value').then(snap => ref.set((snap.val() || 0) + 1));
}

function abrirPlayerGeral(id, tipoTMDB, tipoTracking) { 
    window.filmeAbertoID = id; 
    window.tipoAberto = tipoTMDB; 
    window.tipoTrackingGlobal = tipoTracking;
    exibirTelaDetalhes(id, tipoTMDB, tipoTracking); 
}

function exibirTelaDetalhes(id, tipo, tipoTracking) {
    document.getElementById('videoView').style.display = 'none';
    document.getElementById('trailerView').style.display = 'none';
    document.getElementById('detailsView').style.display = 'block';
    document.getElementById('videoContainer').innerHTML = ''; 
    document.getElementById('trailerContainer').innerHTML = ''; 
    document.getElementById('playerModal').classList.add('active');

    const extraData = tipo === 'movie' ? 'release_dates,credits,images,videos,recommendations' : 'content_ratings,credits,images,videos,recommendations';
    const url = `https://api.themoviedb.org/3/${tipo}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=${extraData}`;
    
    fetch(url).then(res => res.json()).then(dados => {
        const titulo = dados.title || dados.name; 
        const backdrop = dados.backdrop_path ? `https://image.tmdb.org/t/p/w780${dados.backdrop_path}` : '';
        const ano = (dados.release_date || dados.first_air_date || '----').split('-')[0];
        
        document.getElementById('modalBackdrop').style.backgroundImage = backdrop ? `url('${backdrop}')` : 'none';

        const titleContainer = document.getElementById('modalTitleContainer');
        if (dados.images && dados.images.logos && dados.images.logos.length > 0) {
            titleContainer.innerHTML = `<img src="https://image.tmdb.org/t/p/w500${dados.images.logos[0].file_path}" class="logo-img" alt="${titulo}">`;
        } else {
            titleContainer.innerHTML = `<h1 id="modalTitle">${titulo}</h1>`;
        }

        document.getElementById('modalOverview').innerText = dados.overview || "Sinopse não disponível.";
        document.getElementById('modalYear').innerText = ano;
        document.getElementById('modalTagline').innerText = dados.tagline ? `"${dados.tagline}"` : '';
        document.getElementById('modalGenres').innerText = dados.genres?.map(g => g.name).join(' • ') || 'Gênero Desconhecido';
        
        if (tipo === 'tv') {
            document.getElementById('modalDuration').innerText = `${dados.number_of_seasons || '1'} Temp.`;
        } else {
            const rt = dados.runtime;
            document.getElementById('modalDuration').innerText = rt > 0 ? `${Math.floor(rt / 60)}h ${rt % 60}m` : '---';
        }

        let ageRating = 'SR';
        if (tipo === 'movie' && dados.release_dates) {
            const br = dados.release_dates.results.find(r => r.iso_3166_1 === 'BR');
            ageRating = br?.release_dates[0]?.certification || 'SR';
        } else if (tipo === 'tv' && dados.content_ratings) {
            const br = dados.content_ratings.results.find(r => r.iso_3166_1 === 'BR');
            ageRating = br?.rating || 'SR';
        }
        document.querySelector('.meta-item.age-rating').innerText = ageRating;

        const castGrid = document.getElementById('modalCastGrid');
        castGrid.innerHTML = '';
        dados.credits?.cast?.slice(0, 5).forEach(ator => {
            const foto = ator.profile_path ? `https://image.tmdb.org/t/p/w185${ator.profile_path}` : 'https://placehold.co/60x60/222/555?text=Foto';
            castGrid.innerHTML += `<div class="cast-member"><img src="${foto}"><span>${ator.name.split(' ')[0]}</span></div>`;
        });

        const btnTrailer = document.getElementById('btnTrailer');
        urlTrailerGlobal = null;
        const trailer = dados.videos?.results?.find(v => v.site === "YouTube" && v.type === "Trailer");
        if (trailer) { urlTrailerGlobal = trailer.key; btnTrailer.style.display = 'flex'; btnTrailer.onclick = abrirTrailer; } else { btnTrailer.style.display = 'none'; }

        // SISTEMA DE LISTA PROTEGIDO
        const user = auth.currentUser;
        const btnLista = document.getElementById('btnMinhaLista');
        if (user && btnLista) {
            database.ref('usuarios/' + user.uid + '/minhaLista/' + id).on('value', snap => {
                if (snap.exists() && snap.val() === true) {
                    btnLista.innerHTML = `<i class="fa-solid fa-check" style="color: #2ecc71;"></i> Remover da Lista`;
                    btnLista.onclick = () => database.ref('usuarios/' + user.uid + '/minhaLista/' + id).remove();
                } else {
                    btnLista.innerHTML = `<i class="fa-solid fa-plus"></i> Minha Lista`;
                    btnLista.onclick = () => database.ref('usuarios/' + user.uid + '/minhaLista/' + id).set(true);
                }
            });
        } else if (btnLista) {
            btnLista.innerHTML = `<i class="fa-solid fa-plus"></i> Minha Lista`;
            btnLista.onclick = () => { fecharPlayer(); abrirTelaLogin(); };
        }

        const similarGrid = document.getElementById('modalSimilarGrid');
        similarGrid.innerHTML = '';
        dados.recommendations?.results?.slice(0, 10).forEach(sim => {
            if(sim.poster_path) {
                similarGrid.innerHTML += `<div class="similar-card" onclick="abrirPlayerGeral('${sim.id}', '${tipo}', '${tipoTracking}')"><img src="https://image.tmdb.org/t/p/w342${sim.poster_path}"></div>`;
            }
        });

    }).catch(erro => console.error(erro));

    resetarEstrelas(); 
    registrarView(id, tipoTracking); 
}

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
    document.getElementById('videoView').style.display = 'none'; document.getElementById('trailerView').style.display = 'none'; 
    document.getElementById('detailsView').style.display = 'block';
    document.getElementById('videoContainer').innerHTML = ''; document.getElementById('trailerContainer').innerHTML = ''; 
}
function fecharPlayer() { document.getElementById('playerModal').classList.remove('active'); }
function resetarEstrelas() { document.getElementById('ratingMsg').innerText = ""; document.querySelectorAll('input[name="rating"]').forEach(s => { s.checked = false; s.disabled = false; }); }

// ========================================================
// 🟢 NOVO MOTOR DE VITRINE E CONTADORES ABSURDOS
// ========================================================
async function carregarCatalogoDinamicamente() {
    const paginasParaCarregar = 4; // Carrega 80 itens na vitrine

    // 1. Filmes Populares
    fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`)
    .then(r => r.json()).then(d => {
        // Usa o número TOTAL oficial do banco mundial (Ex: 45.000)
        injetarContadorNoTitulo('filmes', d.total_results.toLocaleString('pt-BR') + ' títulos');
    });

    for(let i = 1; i <= paginasParaCarregar; i++) {
        let res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=${i}`);
        let dados = await res.json();
        if(dados.results) dados.results.forEach(item => exibirCardNaGrade(item, 'carrossel-filmes', 'movie', 'movie'));
    }

    // 2. Séries Populares
    fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`)
    .then(r => r.json()).then(d => injetarContadorNoTitulo('series', d.total_results.toLocaleString('pt-BR') + ' séries'));

    for(let i = 1; i <= paginasParaCarregar; i++) {
        let res = await fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=${i}`);
        let dados = await res.json();
        if(dados.results) {
            const completas = dados.results.filter(s => !s.origin_country?.includes('JP'));
            completas.forEach(item => exibirCardNaGrade(item, 'carrossel-series', 'tv', 'tv'));
        }
    }

    // 3. Animes Populares
    fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=1`)
    .then(r => r.json()).then(d => injetarContadorNoTitulo('animes', d.total_results.toLocaleString('pt-BR') + ' animes'));

    for(let i = 1; i <= paginasParaCarregar; i++) {
        let res = await fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=${i}`);
        let dados = await res.json();
        if(dados.results) dados.results.forEach(item => exibirCardNaGrade(item, 'carrossel-animes', 'tv', 'anime'));
    }
}

function exibirCardNaGrade(item, containerId, tipoTMDB, tipoTracking) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let title = item.title || item.name;
    let poster = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://placehold.co/500x750/222/FFF?text=Sem+Capa';
    
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('onclick', `abrirPlayerGeral('${item.id}', '${tipoTMDB}', '${tipoTracking}')`);
    card.innerHTML = `<img src="${poster}" alt="${title}"><h3>${title}</h3><div class="card-meta"><span>⭐ <span id="star-${item.id}">0.0</span></span><span>👁️ <span id="view-${item.id}">0</span></span></div>`;
    container.appendChild(card);
    
    database.ref(`views/${tipoTracking}/${item.id}`).on('value', snap => { if(snap.exists()) { let v = document.getElementById('view-' + item.id); if(v) v.innerText = snap.val(); } });
    database.ref('ratings/' + item.id).on('value', snap => { if(snap.exists()) { let t = 0, c = 0; snap.forEach(vo => { t += vo.val(); c++; }); let s = document.getElementById('star-' + item.id); if(s) s.innerText = (t/c).toFixed(1); } });
}

// ========================================================
// 🔥 MOTOR DO TOP 10 MAIS ASSISTIDOS DO SEU SITE
// ========================================================
async function carregarTop10Assistidos() {
    const renderizarRanking = async (tipoTracking, containerId, tipoTMDB) => {
        const snap = await database.ref('views/' + tipoTracking).once('value');
        if (!snap.exists()) return;
        
        let lista = [];
        snap.forEach(child => { lista.push({ id: child.key, views: child.val() }); });
        lista.sort((a, b) => b.views - a.views);
        
        const top10 = lista.slice(0, 10);
        const container = document.getElementById(containerId);
        if(container) container.innerHTML = ''; 
        
        for (let item of top10) {
            await new Promise(r => setTimeout(r, 100)); 
            fetch(`https://api.themoviedb.org/3/${tipoTMDB}/${item.id}?api_key=${TMDB_API_KEY}&language=pt-BR`)
            .then(r => r.json()).then(dados => {
                if(dados.id) exibirCardNaGrade(dados, containerId, tipoTMDB, tipoTracking);
            });
        }
    };

    await renderizarRanking('movie', 'carrossel-top-filmes', 'movie');
    await renderizarRanking('tv', 'carrossel-top-series', 'tv');
    await renderizarRanking('anime', 'carrossel-top-animes', 'tv');
}

function injetarContadorNoTitulo(sectionId, total) {
    const h2Element = document.querySelector(`#${sectionId} h2`);
    if (h2Element) {
        const antigo = h2Element.querySelector('.badge-contador');
        if (antigo) antigo.remove();
        h2Element.innerHTML += ` <span class="badge-contador" style="background: #e50914; color: #fff; font-size: 0.6em; padding: 3px 9px; border-radius: 20px; margin-left: 10px; font-weight: 600; vertical-align: middle; white-space: nowrap;">${total}</span>`;
    }
}

function puxarTendenciasGerais() {
    fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=pt-BR`)
        .then(res => res.json()).then(dados => {
            const container = document.getElementById('carrossel-tendencias');
            dados.results.slice(0, 10).forEach(item => {
                const poster = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
                const card = document.createElement('div');
                card.className = 'card';
                card.setAttribute('onclick', `abrirPlayerGeral('${item.id}', 'movie', 'movie')`);
                card.innerHTML = `<img src="${poster}" alt="${item.title}"><h3>${item.title}</h3><div class="card-meta"><span style="color:#e50914; font-weight:bold;">Em Alta</span></div>`;
                container.appendChild(card);
            });
        });
}

function iniciarCarrosselAutomatico() {
    ['carrossel-top-filmes', 'carrossel-top-series', 'carrossel-top-animes'].forEach(id => {
        const container = document.getElementById(id);
        if (!container) return;
        let dir = 1; 
        setInterval(() => {
            const card = container.querySelector('.card');
            if (!card) return; 
            const jump = card.offsetWidth + 15; 
            if (dir === 1 && container.scrollLeft >= (container.scrollWidth - container.clientWidth) - 10) { dir = -1; }
            else if (dir === -1 && container.scrollLeft <= 10) { dir = 1; }
            container.scrollBy({ left: jump * dir, behavior: 'smooth' });
        }, 4000); 
    });
}

window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.avatar-option').forEach(img => {
        img.addEventListener('click', function() {
            document.querySelectorAll('.avatar-option').forEach(a => a.classList.remove('selected'));
            this.classList.add('selected');
            document.getElementById('avatarSelecionado').value = this.getAttribute('data-avatar');
        });
    });

    const formRegistro = document.getElementById('formRegistro');
    if(formRegistro) {
        formRegistro.addEventListener('submit', function(e) {
            e.preventDefault(); 
            const email = document.getElementById('regEmail').value.toLowerCase();
            const senha = document.getElementById('regSenha').value;
            const erroMsg = document.getElementById('erroRegistro');
            
            auth.createUserWithEmailAndPassword(email, senha)
            .then((userCredential) => {
                database.ref('usuarios/' + userCredential.user.uid).set({
                    avatar: document.getElementById('avatarSelecionado').value,
                    email: email,
                    dataCriacao: new Date().toISOString()
                }).then(() => window.location.reload());
            })
            .catch((error) => { erroMsg.innerText = "Erro: " + error.message; erroMsg.style.display = 'block'; });
        });
    }

    const formLogin = document.getElementById('formLogin');
    if(formLogin) {
        formLogin.addEventListener('submit', function(e) {
            e.preventDefault();
            auth.signInWithEmailAndPassword(formLogin.querySelector('input[type="email"]').value, formLogin.querySelector('input[type="password"]').value)
            .then(() => window.location.reload())
            .catch(() => alert("❌ E-mail ou senha incorretos."));
        });
    }

    // A barra de pesquisa agora aciona o motor do TMDB
    document.getElementById('searchInput')?.addEventListener('input', filtrarCatalogo);
    carregarCatalogoDinamicamente();
    carregarTop10Assistidos(); 
    puxarTendenciasGerais();
    iniciarCarrosselAutomatico();
});
