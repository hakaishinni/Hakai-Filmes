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
    let auth = document.getElementById('authOverlay');
    if(auth) {
        auth.style.display = 'none'; // Essa linha é a marreta que força a tela a sumir!
        auth.classList.remove('active');
    }
    document.body.style.overflow = 'auto'; // Devolve a rolagem da página
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const btn = document.getElementById('themeToggle');
    btn.innerText = document.body.classList.contains('light-mode') ? "🌙 Dark" : "☀️ Light";
}

// ==========================================
// FUNÇÕES DO PLAYER DE VÍDEO
// ==========================================

// Adiciona +1 view no Firebase assim que abre o player
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
    
    resetarEstrelas();
    registrarView(idFilme); // Salva a view!
}

function abrirPlayerSerie(idSerie) {
    window.filmeAbertoID = idSerie;
    document.getElementById('playerModal').classList.add('active'); 
    
    document.getElementById('videoContainer').innerHTML = `<iframe src="https://myembed.biz/serie/${idSerie}" width="100%" style="height: 70vh; min-height: 500px;" frameborder="0" allowfullscreen></iframe>`;
    
    resetarEstrelas();
    registrarView(idSerie); // Salva a view!
}

function resetarEstrelas() {
    document.querySelectorAll('input[name="star"]').forEach(s => { 
        s.checked = false; 
        s.disabled = false; 
    });
}

function fecharPlayer() {
    document.getElementById('playerModal').classList.remove('active'); 
    document.getElementById('videoContainer').innerHTML = ''; 
}

/* =======================================================
   SISTEMA DE CATÁLOGO DINÂMICO (FIREBASE + TMDB)
   ======================================================= */
const TMDB_API_KEY = '40a84247b6de679f7ee596d02231aeb0';

// 1. Função que lê o Firebase e inicia a busca
function carregarCatalogoDinamicamente() {
    database.ref('catalogo').once('value').then((snapshot) => {
        if (snapshot.exists()) {
            const dados = snapshot.val();
            
            // Puxa Filmes (movie no TMDB)
            if (dados.filmes) {
                Object.keys(dados.filmes).forEach(id => puxarDadosTMDB(id, 'carrossel-filmes', 'movie'));
            }
            // Puxa Séries (tv no TMDB)
            if (dados.series) {
                Object.keys(dados.series).forEach(id => puxarDadosTMDB(id, 'carrossel-series', 'tv'));
            }
            // Puxa Animes (O TMDB considera anime como série 'tv')
            if (dados.animes) {
                Object.keys(dados.animes).forEach(id => puxarDadosTMDB(id, 'carrossel-animes', 'tv'));
            }
        }
    }).catch(erro => console.error("Erro ao ler catálogo do Firebase:", erro));
}

// 2. Função que vai no TMDB, cria o card e coloca na tela
function puxarDadosTMDB(id, containerId, tipo) {
    const url = `https://api.themoviedb.org/3/${tipo}/${id}?api_key=${TMDB_API_KEY}&language=pt-BR`;
    
    fetch(url)
        .then(resposta => resposta.json())
        .then(dados => {
            // O TMDB usa 'title' para filmes e 'name' para séries/animes
            const titulo = dados.title || dados.name; 
            const poster = `https://image.tmdb.org/t/p/w500${dados.poster_path}`;
            
            const container = document.getElementById(containerId);
            
            // Cria a caixinha do filme
            const card = document.createElement('div');
            card.className = 'card';
            
            // CORREÇÃO: Abre o player certo dependendo se é filme ou série!
            if (tipo === 'tv') {
                card.setAttribute('onclick', `abrirPlayerSerie('${id}')`); 
            } else {
                card.setAttribute('onclick', `abrirPlayer('${id}')`); 
            }
            
            // Monta o visual do card
            card.innerHTML = `
                <img src="${poster}" alt="${titulo}">
                <h3>${titulo}</h3>
                <div class="card-meta">
                    <span>⭐ <span class="star-count" id="star-${id}">0.0</span></span>
                    <span>👁️ <span class="view-count" id="view-${id}">0</span></span>
                </div>
            `;
            
            // Adiciona o card na tela
            if (container) {
                container.appendChild(card);
            }
            
            // 3. Conecta as Visualizações em tempo real
            database.ref('views/' + id).on('value', (snap) => {
                if(snap.exists()) {
                    let viewSpan = document.getElementById('view-' + id);
                    if(viewSpan) viewSpan.innerText = snap.val();
                }
            });
            
            // 4. Conecta as Notas (Estrelas) em tempo real
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

// Lógica para enviar a nota (Estrelas) quando o usuário clica
document.addEventListener('change', function(e) {
    if(e.target.name === 'star' && filmeAbertoID) {
        let nota = parseInt(e.target.value);
        let timestamp = new Date().getTime(); // Gera um ID único pro voto
        
        // Salva a nota no banco de dados
        database.ref('ratings/' + filmeAbertoID + '/' + timestamp).set(nota)
            .then(() => {
                // Desativa as estrelas para a pessoa não votar duas vezes seguidas
                document.querySelectorAll('input[name="star"]').forEach(s => s.disabled = true);
            });
    }
});

// Faz a mágica rodar assim que a página terminar de carregar
window.addEventListener('DOMContentLoaded', carregarCatalogoDinamicamente);
