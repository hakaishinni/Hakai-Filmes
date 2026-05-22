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
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function filtrarCatalogo() {
    const filter = document.getElementById('searchInput').value.toLowerCase();
    document.querySelectorAll('.card').forEach(card => {
        const titleEl = card.querySelector('h3');
        if (titleEl) card.style.display = titleEl.innerText.toLowerCase().includes(filter) ? "" : "none";
    });
}

function entrarComoConvidado() {
    let authTela = document.getElementById('authOverlay');
    if(authTela) { authTela.style.display = 'none'; authTela.classList.remove('active'); }
    document.body.style.overflow = 'auto'; 
    localStorage.setItem('hkFilmes_acessoLiberado', 'true');
    const guestProfile = document.getElementById('guestHeaderProfile');
    if (guestProfile) guestProfile.style.display = 'flex';
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
// 🟢 NOVO MOTOR 100% AUTOMÁTICO DO CATÁLOGO GERAL
// ========================================================
function carregarCatalogoDinamicamente() {
    fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`)
        .then(res => res.json()).then(dados => {
            if(dados.results) {
                injetarContadorNoTitulo('filmes', dados.results.length);
                dados.results.forEach(item => exibirCardNaGrade(item, 'carrossel-filmes', 'movie', 'movie'));
            }
        });

    fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=pt-BR&page=1`)
        .then(res => res.json()).then(dados => {
            if(dados.results) {
                const completas = dados.results.filter(s => !s.origin_country?.includes('JP'));
                injetarContadorNoTitulo('series', completas.length);
                completas.forEach(item => exibirCardNaGrade(item, 'carrossel-series', 'tv', 'tv'));
            }
        });

    fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=pt-BR&with_genres=16&with_original_language=ja&sort_by=popularity.desc&page=1`)
        .then(res => res.json()).then(dados => {
            if(dados.results) {
                injetarContadorNoTitulo('animes', dados.results.length);
                dados.results.forEach(item => exibirCardNaGrade(item, 'carrossel-animes', 'tv', 'anime'));
            }
        });
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
        h2Element.innerHTML += ` <span class="badge-contador" style="background: #e50914; color: #fff; font-size: 0.55em; padding: 3px 9px; border-radius: 20px; margin-left: 10px; font-weight: 600; vertical-align: middle;">${total}</span>`;
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

    document.getElementById('searchInput')?.addEventListener('input', filtrarCatalogo);
    carregarCatalogoDinamicamente();
    carregarTop10Assistidos(); 
    puxarTendenciasGerais();
    iniciarCarrosselAutomatico();
});
