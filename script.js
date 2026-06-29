import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs,
    deleteDoc, 
    doc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyDRPro7oeI4z3faIUGoqW_xLZGF2dH-PwA",
    authDomain: "trailersbliss.firebaseapp.com",
    projectId: "trailersbliss",
    storageBucket: "trailersbliss.firebasestorage.app",
    messagingSenderId: "363232415056",
    appId: "1:363232415056:web:c832a34c61619c4e7a3055",
    measurementId: "G-NSXBVWL28C"
};

// Firebase Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", function() {
   
    // Global Array
    window.allTrailersData = [];

    // =========================================
    // FIREBASE CONNECTION TEST - NEW
    // =========================================
    async function testFirebaseConnection() {
        try {
            const testRef = collection(db, "trailers");
            const snapshot = await getDocs(testRef);
            console.log("✅ Firebase Connected! Total docs:", snapshot.size);
            return true;
        } catch (e) {
            console.error("❌ Firebase Connection Failed:", e);
            // Show error message to user
            const container = document.getElementById('dynamic-trailers');
            if (container) {
                container.innerHTML = `
                    <div class="col-12 text-center">
                        <h4 style="color: #ffcc00;">⚠️ Unable to load trailers</h4>
                        <p style="color: #aaa;">Please check your internet connection and try again.</p>
                        <small style="color: #666;">Error: ${e.message}</small>
                    </div>
                `;
            }
            return false;
        }
    }

    // =========================================
    // PREMIUM PRELOADER TIMER LOGIC
    // =========================================
    const preloader = document.getElementById('custom-preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('fade-out');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 600); 
        }, 3000); 
    }
    
    // =========================================
    // 1. CATEGORY FILTERING LOGIC
    // =========================================
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const selectedCategory = this.getAttribute('data-filter');
            const allMovieCards = document.querySelectorAll('.dynamic-movie-card');
            
            allMovieCards.forEach(card => {
                if (selectedCategory === 'all') {
                    card.style.display = 'block';
                } else {
                    if (card.getAttribute('data-category') === selectedCategory) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
        });
    });

   // =========================================
    // 2. THEME & ADMIN MODE CHECK
    // =========================================
    if (sessionStorage.getItem('isAdmin') === 'true') {
        document.body.classList.add('admin-mode');
    }
    
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement; 

    if (!htmlElement.getAttribute('data-theme')) {
        htmlElement.setAttribute('data-theme', 'dark'); 
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', function(e) {
            e.preventDefault(); 
            this.classList.toggle('active');
            let currentTheme = htmlElement.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                htmlElement.setAttribute('data-theme', 'light');
            } else {
                htmlElement.setAttribute('data-theme', 'dark');
            }
        });
    }

    // =========================================
    // 3. NAVBAR SCROLL EFFECT
    // =========================================
    window.addEventListener('scroll', function() {
        const navbar = document.getElementById('mainNavbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });

    // =========================================
    // 4. ADMIN LOGIN LOGIC
    // =========================================
    const loginBtn = document.getElementById('loginBtn');
    const adminPasswordInput = document.getElementById('adminPassword');
    const loginError = document.getElementById('loginError');

    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault(); 
            const password = adminPasswordInput.value;
            
            if (password === 'adminyenuka') { 
                if(loginError) loginError.classList.add('d-none');
                sessionStorage.setItem('isAdmin', 'true');
                document.body.classList.add('admin-mode');
                
                const loginModalEl = document.getElementById('adminLoginModal');
                if (loginModalEl) {
                    const loginModal = bootstrap.Modal.getInstance(loginModalEl) || new bootstrap.Modal(loginModalEl);
                    loginModal.hide();
                }
                if(adminPasswordInput) adminPasswordInput.value = '';

                setTimeout(() => {
                    const dashboardModalEl = document.getElementById('adminDashboardModal');
                    if (dashboardModalEl) {
                        const dashboardModal = bootstrap.Modal.getInstance(dashboardModalEl) || new bootstrap.Modal(dashboardModalEl);
                        dashboardModal.show();
                    }
                }, 400);
            } else {
                if(loginError) loginError.classList.remove('d-none');
            }
        });
    }

    // =========================================
    // 5. ADD TRAILER TO FIREBASE
    // =========================================
    const addTrailerForm = document.getElementById('addTrailerForm');
    if (addTrailerForm) {
        addTrailerForm.addEventListener('submit', async function(e) {
            e.preventDefault(); 
            const title = document.getElementById('movieTitle').value;
            const year = document.getElementById('movieYear').value;
            const image = document.getElementById('movieImage').value;
            const trailer = document.getElementById('movieTrailer').value;
            const category = document.getElementById('movieCategory').value;

            const newTrailer = { title, year, image, trailer, category, createdAt: Date.now() };
            const docId = await saveTrailerToFirebase(newTrailer);

            if (docId) {
                addTrailerToUI(newTrailer, docId, true);
                window.allTrailersData.unshift({ id: docId, data: newTrailer });
                alert('Trailer Added Successfully! 🎉');
                addTrailerForm.reset(); 
            } else {
                alert('Error! Could not add trailer.');
            }
        });
    }

    // =========================================
    // 6. FIREBASE FUNCTIONS
    // =========================================
    async function saveTrailerToFirebase(trailer) {
        try {
            const docRef = await addDoc(collection(db, "trailers"), trailer);
            return docRef.id; 
        } catch (e) {
            console.error("Error adding document: ", e);
            return null;
        }
    }

    async function loadTrailersFromFirebase() {
        try {
            // Test connection first
            const connected = await testFirebaseConnection();
            if (!connected) return;

            const querySnapshot = await getDocs(collection(db, "trailers"));
            
            // Check if collection is empty
            if (querySnapshot.empty) {
                console.warn("⚠️ No trailers found in Firebase!");
                const container = document.getElementById('dynamic-trailers');
                if (container) {
                    container.innerHTML = `
                        <div class="col-12 text-center">
                            <h4 style="color: #ffcc00;">🎬 No Trailers Yet</h4>
                            <p style="color: #aaa;">Be the first to add a trailer!</p>
                        </div>
                    `;
                }
                return;
            }

            let trailersArray = [];

            querySnapshot.forEach((doc) => {
                let data = doc.data();
                if (!data.createdAt) {
                    data.createdAt = 0;
                }
                trailersArray.push({ id: doc.id, data: data });
            });

            trailersArray.sort((a, b) => b.data.createdAt - a.data.createdAt);
            window.allTrailersData = trailersArray;

            // Clear container before adding
            const container = document.getElementById('dynamic-trailers');
            if (container) container.innerHTML = '';

            trailersArray.forEach((item) => {
                addTrailerToUI(item.data, item.id, false);
            });

            console.log(`✅ Loaded ${trailersArray.length} trailers successfully!`);

        } catch (e) {
            console.error("Error loading trailers: ", e);
            const container = document.getElementById('dynamic-trailers');
            if (container) {
                container.innerHTML = `
                    <div class="col-12 text-center">
                        <h4 style="color: #ffcc00;">⚠️ Error Loading Trailers</h4>
                        <p style="color: #aaa;">Please refresh the page or try again later.</p>
                        <small style="color: #666;">Error: ${e.message}</small>
                    </div>
                `;
            }
        }
    }

    async function deleteTrailerFromFirebase(docId, elementToRemove) {
        const checkAdmin = sessionStorage.getItem('isAdmin') === 'true';
        if (!checkAdmin) {
            alert("Access denied! Admin only.");
            return;
        }
        if (confirm("Are you sure you want to delete this trailer?")) {
            try {
                await deleteDoc(doc(db, "trailers", docId));
                elementToRemove.remove(); 
                window.allTrailersData = window.allTrailersData.filter(item => item.id !== docId);
                alert("Trailer Deleted Successfully! 🗑️");
            } catch (e) {
                console.error("Error deleting document: ", e);
                alert("Error deleting trailer.");
            }
        }
    }

    function getYouTubeVideoId(url) {
        let videoId = null;
        const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const match = url.match(ytRegex);
        if (match && match[1]) {
            videoId = match[1];
        }
        return videoId;
    }

    function addTrailerToUI(trailer, docId, isNew = false) {
        const dynamicTrailers = document.getElementById('dynamic-trailers');
        if (!dynamicTrailers) return;

        const colDiv = document.createElement('div');
        colDiv.className = 'col-6 col-md-4 col-lg-3 dynamic-movie-card';
        const movieCategory = trailer.category || 'Other'; 
        colDiv.setAttribute('data-category', movieCategory);

        const videoId = getYouTubeVideoId(trailer.trailer);
        const targetLink = videoId ? `video.html?id=${videoId}` : trailer.trailer;

        colDiv.innerHTML = `
            <div class="movie-card-wrapper" style="position:relative;">
                <button class="btn btn-danger btn-sm delete-btn" style="position:absolute; top:8px; right:8px; z-index:10; border-radius: 5px; padding: 4px 10px; font-size: 12px; font-weight: bold; box-shadow: 0px 2px 5px rgba(0,0,0,0.5);">
                    <i class="fas fa-trash"></i> Delete
                </button>
                <a href="${targetLink}" class="movie-card" target="_blank">
                    <div class="year-badge">${trailer.year}</div>
                    <div class="category-badge">${movieCategory}</div> 
                    <div class="sub-badge">OFFICIAL TRAILER</div>
                    <img src="${trailer.image}" alt="Movie Poster">
                    <div class="movie-info">
                        <h5 class="movie-title">${trailer.title}</h5>
                    </div>
                </a>
            </div>
        `;
        
        if (isNew) {
            dynamicTrailers.prepend(colDiv);
        } else {
            dynamicTrailers.append(colDiv); 
        }

        const deleteBtn = colDiv.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function(e) {
            e.preventDefault(); 
            e.stopPropagation(); 
            deleteTrailerFromFirebase(docId, colDiv);
        });
    }

    // =========================================
    // 7. SEARCH BAR LOGIC
    // =========================================
    const searchBox = document.getElementById('movieSearchBox');
    const suggestionsBox = document.getElementById('searchSuggestions');

    if (searchBox && suggestionsBox) {
        
        searchBox.addEventListener('input', function() {
            const query = this.value.toLowerCase().trim();
            suggestionsBox.innerHTML = ''; 

            if (query === '') {
                suggestionsBox.style.display = 'none';
                return;
            }

            const matchedMovies = window.allTrailersData.filter(item =>
                item.data.title.toLowerCase().includes(query)
            );

            if (matchedMovies.length > 0) {
                suggestionsBox.style.display = 'flex';
                matchedMovies.forEach(movie => {
                    const videoId = getYouTubeVideoId(movie.data.trailer);
                    const targetLink = videoId ? `video.html?id=${videoId}` : movie.data.trailer;

                    const itemDiv = document.createElement('a');
                    itemDiv.href = targetLink;
                    itemDiv.target = "_blank";
                    itemDiv.className = 'search-suggestion-item';
                    
                    itemDiv.innerHTML = `
                        <img src="${movie.data.image}" alt="${movie.data.title}">
                        <span>${movie.data.title}</span>
                    `;
                    
                    suggestionsBox.appendChild(itemDiv);
                });
            } else {
                suggestionsBox.style.display = 'none';
            }
        });

        searchBox.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = this.value.toLowerCase().trim();
                suggestionsBox.style.display = 'none';

                const allMovieCards = document.querySelectorAll('.dynamic-movie-card');
                let foundAny = false;

                allMovieCards.forEach(card => {
                    const title = card.querySelector('.movie-title').textContent.toLowerCase();
                    if (title.includes(query)) {
                        card.style.display = 'block';
                        foundAny = true;
                    } else {
                        card.style.display = 'none';
                    }
                });

                const allFilterBtn = document.querySelector('.filter-btn[data-filter="all"]');
                if(allFilterBtn) {
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    allFilterBtn.classList.add('active');
                }
            }
        });

        document.addEventListener('click', function(e) {
            if (!searchBox.contains(e.target) && !suggestionsBox.contains(e.target)) {
                suggestionsBox.style.display = 'none';
            }
        });
    }

    // =========================================
    // LOAD TRAILERS FROM FIREBASE
    // =========================================
    loadTrailersFromFirebase();
});