import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Tinhlamuselo ta Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDRPro7oeI4z3faIUGoqW_xLZGF2dH-PwA",
    authDomain: "trailersbliss.firebaseapp.com",
    projectId: "trailersbliss",
    storageBucket: "trailersbliss.firebasestorage.app",
    messagingSenderId: "363232415056",
    appId: "1:363232415056:web:c832a34c61619c4e7a3055",
    measurementId: "G-NSXBVWL28C"
};

// Sungula Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", function() {
    window.allTrailersData = [];

    // KAMBERA NXIHLANGANISO WA FIREBASE
    async function testFirebaseConnection() {
        try {
            const testRef = collection(db, "trailers");
            await getDocs(testRef);
            return true;
        } catch (e) {
            console.error("Firebase Connection Failed:", e);
            const container = document.getElementById('dynamic-trailers');
            if (container) {
                container.innerHTML = `<div class="col-12 text-center"><h4 style="color: #ffcc00;">⚠️ Swi tsandzile ku nghenisa titrailer</h4><p style="color: #aaa;">Kambela inthaneti ya wena kumbe u tirhisa local server.</p></div>`;
            }
            return false;
        }
    }

    // XITIRHO XO KHOMELA (PRELOADER)
    const preloader = document.getElementById('custom-preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('fade-out');
            setTimeout(() => preloader.style.display = 'none', 600); 
        }, 1500);
    }
    
    // MAENDLELO YO HLUTA HI XIYENGE
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const selectedCategory = this.getAttribute('data-filter');
            const allMovieCards = document.querySelectorAll('.dynamic-movie-card');
            allMovieCards.forEach(card => {
                if (selectedCategory === 'all' || card.getAttribute('data-category') === selectedCategory) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // KAMBELA MUHLOVO & MFUMO WA MUFAMBISI
    if (sessionStorage.getItem('isAdmin') === 'true') document.body.classList.add('admin-mode');
    
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement; 
    if (!htmlElement.getAttribute('data-theme')) htmlElement.setAttribute('data-theme', 'dark'); 

    if (themeToggle) {
        themeToggle.addEventListener('click', function(e) {
            e.preventDefault(); 
            this.classList.toggle('active');
            let currentTheme = htmlElement.getAttribute('data-theme');
            htmlElement.setAttribute('data-theme', currentTheme === 'dark' ? 'light' : 'dark');
        });
    }

    // MAENDLELO YA SCROLL EKA NAVBAR
    window.addEventListener('scroll', function() {
        const navbar = document.getElementById('mainNavbar');
        if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    // MAENDLELO YO NGHENA YA MUFAMBISI
    const loginBtn = document.getElementById('loginBtn');
    const adminPasswordInput = document.getElementById('adminPassword');
    const loginError = document.getElementById('loginError');

    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault(); 
            if (adminPasswordInput.value === 'adminyenuka') { 
                if(loginError) loginError.classList.add('d-none');
                sessionStorage.setItem('isAdmin', 'true');
                document.body.classList.add('admin-mode');
                const loginModalEl = document.getElementById('adminLoginModal');
                if (loginModalEl) bootstrap.Modal.getInstance(loginModalEl).hide();
                adminPasswordInput.value = '';
                setTimeout(() => {
                    const dashboardModalEl = document.getElementById('adminDashboardModal');
                    if (dashboardModalEl) new bootstrap.Modal(dashboardModalEl).show();
                }, 400);
            } else {
                if(loginError) loginError.classList.remove('d-none');
            }
        });
    }

    // NGHENISA TRAILER EKA FIREBASE
    const addTrailerForm = document.getElementById('addTrailerForm');
    if (addTrailerForm) {
        addTrailerForm.addEventListener('submit', async function(e) {
            e.preventDefault(); 
            const newTrailer = { 
                title: document.getElementById('movieTitle').value, 
                year: document.getElementById('movieYear').value, 
                image: document.getElementById('movieImage').value, 
                trailer: document.getElementById('movieTrailer').value, 
                category: document.getElementById('movieCategory').value, 
                createdAt: Date.now() 
            };
            try {
                const docRef = await addDoc(collection(db, "trailers"), newTrailer);
                addTrailerToUI(newTrailer, docRef.id, true);
                window.allTrailersData.unshift({ id: docRef.id, data: newTrailer });
                alert('Trailer yi nghenisiwile hi ku humelela! 🎉');
                addTrailerForm.reset(); 
            } catch (e) { alert('Xihoxo! Swi tsandzile ku nghenisa trailer.'); }
        });
    }

    // SULA TRAILER
    window.deleteTrailerFromFirebase = async function(docId, elementToRemove) {
        if (sessionStorage.getItem('isAdmin') !== 'true') return alert("U nyimiwile! Leswi i swa Mufambisi ntsena.");
        if (confirm("Xana u tiyisile leswaku u lava ku sula leyi trailer?")) {
            try {
                await deleteDoc(doc(db, "trailers", docId));
                elementToRemove.remove(); 
                window.allTrailersData = window.allTrailersData.filter(item => item.id !== docId);
                alert("Trailer yi suriwile hi ku humelela! 🗑️");
            } catch (e) { alert("Xihoxo xo sula trailer."); }
        }
    }

    // MAENDLELO YO KUMA ID YA YOUTUBE
    function getYouTubeVideoId(url) {
        if (!url || typeof url !== 'string') return null;
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        return (match && match[1]) ? match[1] : null;
    }

    // KOMBISA TRAILER EKA SKRINI (UI)
    function addTrailerToUI(trailer, docId, isNew = false) {
        const dynamicTrailers = document.getElementById('dynamic-trailers');
        if (!dynamicTrailers) return;

        const colDiv = document.createElement('div');
        colDiv.className = 'col-6 col-md-4 col-lg-3 dynamic-movie-card';
        const movieCategory = trailer.category || 'Other'; 
        colDiv.setAttribute('data-category', movieCategory);

        const videoId = getYouTubeVideoId(trailer.trailer);
        
        // Cinca ku ya eka modal ya vhidiyo yo saseka
        const linkAttr = videoId 
            ? `href="#" data-bs-toggle="modal" data-bs-target="#videoModal" data-video-id="${videoId}"` 
            : `href="${trailer.trailer || '#'}" target="_blank"`;

        colDiv.innerHTML = `
            <div class="movie-card-wrapper" style="position:relative;">
                <button class="btn btn-danger btn-sm delete-btn" style="position:absolute; top:8px; right:8px; z-index:10; border-radius: 5px; padding: 4px 10px; font-size: 12px; font-weight: bold; box-shadow: 0px 2px 5px rgba(0,0,0,0.5);">
                    <i class="fas fa-trash"></i> Sula
                </button>
                <a ${linkAttr} class="movie-card">
                    <div class="year-badge">${trailer.year || '2026'}</div>
                    <div class="category-badge">${movieCategory}</div> 
                    <div class="sub-badge">TRAILER YA XIMFUMO</div>
                    <img src="${trailer.image || 'logo.jpg'}" alt="Phositara" loading="lazy">
                    <div class="movie-info">
                        <h5 class="movie-title">${trailer.title || 'Filimi yo ka yi nga tiviwi'}</h5>
                    </div>
                </a>
            </div>
        `;
        
        isNew ? dynamicTrailers.prepend(colDiv) : dynamicTrailers.append(colDiv); 

        colDiv.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation(); deleteTrailerFromFirebase(docId, colDiv);
        });
    }

    // MAENDLELO YO SECHA
    const searchBox = document.getElementById('movieSearchBox');
    const suggestionsBox = document.getElementById('searchSuggestions');

    if (searchBox && suggestionsBox) {
        searchBox.addEventListener('input', function() {
            const query = this.value.toLowerCase().trim();
            suggestionsBox.innerHTML = ''; 
            if (query === '') return suggestionsBox.style.display = 'none';

            const matchedMovies = window.allTrailersData.filter(item => (item.data.title || '').toLowerCase().includes(query));

            if (matchedMovies.length > 0) {
                suggestionsBox.style.display = 'flex';
                matchedMovies.forEach(movie => {
                    const videoId = getYouTubeVideoId(movie.data.trailer);
                    const itemDiv = document.createElement('a');
                    itemDiv.className = 'search-suggestion-item';
                    
                    if (videoId) {
                        itemDiv.href = "#";
                        itemDiv.setAttribute('data-bs-toggle', 'modal');
                        itemDiv.setAttribute('data-bs-target', '#videoModal');
                        itemDiv.setAttribute('data-video-id', videoId);
                    } else {
                        itemDiv.href = movie.data.trailer || "#";
                        itemDiv.target = "_blank";
                    }
                    
                    itemDiv.innerHTML = `<img src="${movie.data.image || 'logo.jpg'}" alt="${movie.data.title}"><span>${movie.data.title || 'Xihundla'}</span>`;
                    
                    itemDiv.addEventListener('click', () => { suggestionsBox.style.display = 'none'; });
                    suggestionsBox.appendChild(itemDiv);
                });
            } else {
                suggestionsBox.style.display = 'none';
            }
        });

        document.addEventListener('click', (e) => {
            if (!searchBox.contains(e.target) && !suggestionsBox.contains(e.target)) suggestionsBox.style.display = 'none';
        });
    }

    // MAENDLELO YA SKRINI XA VHIDIYO (PLAY/STOP)
    const videoModal = document.getElementById('videoModal');
    if (videoModal) {
        videoModal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const videoId = button.getAttribute('data-video-id');
            const container = document.getElementById('videoModalContainer');
            if (videoId) {
                container.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen style="width: 100%; height: 100%; border: none;"></iframe>`;
            }
        });
        videoModal.addEventListener('hide.bs.modal', function () {
            document.getElementById('videoModalContainer').innerHTML = ''; // Kuyimisa mpfumawulo loko u pfala
        });
    }

    // KUMA VUXOKOXOKO EKA FIREBASE
    async function loadTrailersFromFirebase() {
        if (!(await testFirebaseConnection())) return;
        try {
            const snapshot = await getDocs(collection(db, "trailers"));
            const container = document.getElementById('dynamic-trailers');
            if (snapshot.empty) return container.innerHTML = `<div class="col-12 text-center"><h4 style="color: #ffcc00;">🎬 Ku hava titrailer ta ha ri kona</h4></div>`;
            
            let trailersArray = [];
            snapshot.forEach(doc => trailersArray.push({ id: doc.id, data: doc.data() }));
            trailersArray.sort((a, b) => (b.data.createdAt || 0) - (a.data.createdAt || 0));
            window.allTrailersData = trailersArray;
            
            if (container) container.innerHTML = '';
            trailersArray.forEach(item => addTrailerToUI(item.data, item.id, false));
        } catch (e) {
            console.error(e);
        }
    }

    loadTrailersFromFirebase();
});