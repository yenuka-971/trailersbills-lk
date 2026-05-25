import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs,
    deleteDoc, 
    doc,
    query,      // <--- අලුතින් එකතු කළා (Sorting සඳහා)
    orderBy     // <--- අලුතින් එකතු කළා (Sorting සඳහා)   
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ඔයාගේ Firebase Config එක
const firebaseConfig = {
    apiKey: "AIzaSyDRPro7oeI4z3faIUGoqW_xLZGF2dH-PwA",
    authDomain: "trailersbliss.firebaseapp.com",
    projectId: "trailersbliss",
    storageBucket: "trailersbliss.firebasestorage.app",
    messagingSenderId: "363232415056",
    appId: "1:363232415056:web:c832a34c61619c4e7a3055",
    measurementId: "G-NSXBVWL28C"
};

// Firebase Initialize කිරීම
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", function() {
   
    // =========================================
    // PREMIUM PRELOADER TIMER LOGIC (EXACTLY 3 SECONDS)
    // =========================================
    const preloader = document.getElementById('custom-preloader');
    
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('fade-out');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 600); 
        }, 3000); // හරියටම තත්පර 3ක් පෙන්වයි
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
    // 5. ADD TRAILER TO FIREBASE (FORM SUBMIT)
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

            // සාර්ථකව Sort කිරීම සඳහා "createdAt" නමින් වර්තමාන Timestamp එකක් එකතු කළා
            const newTrailer = { title, year, image, trailer, category, createdAt: Date.now() };

            const docId = await saveTrailerToFirebase(newTrailer);

            if (docId) {
                // 'true' මඟින් කියවෙන්නේ අලුතින්ම දාපු එක ක්ෂණිකව උඩින්ම පෙන්වන්න කියන එකයි
                addTrailerToUI(newTrailer, docId, true); 
                alert('Trailer Added Successfully! 🎉');
                addTrailerForm.reset(); 
            } else {
                alert('දෝෂයක්! දත්ත එකතු කිරීමට නොහැකි විය.');
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
            const trailersRef = collection(db, "trailers");
            // අලුත්ම දේවල් මුලට එන විදිහට query එක සකස් කළා
            const q = query(trailersRef, orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            
            querySnapshot.forEach((doc) => {
                // 'false' යොදන්නේ පරණ ඒවා පිළිවෙලට ලෝඩ් වෙන්නයි
                addTrailerToUI(doc.data(), doc.id, false);
            });
        } catch (e) {
            console.error("Error loading trailers: ", e);
        }
    }

    async function deleteTrailerFromFirebase(docId, elementToRemove) {
        const checkAdmin = sessionStorage.getItem('isAdmin') === 'true';
        if (!checkAdmin) {
            alert("අවසර නැත! මෙම ක්‍රියාව සිදුකළ හැක්කේ ඇඩ්මින්වරයෙකුට පමණි.");
            return;
        }

        if (confirm("ඔබට විශ්වාසද මෙම ට්‍රේලර් එක මකා දැමිය යුතුයි කියා?")) {
            try {
                await deleteDoc(doc(db, "trailers", docId));
                elementToRemove.remove(); 
                alert("Trailer Deleted Successfully! 🗑️");
            } catch (e) {
                console.error("Error deleting document: ", e);
                alert("මකා දැමීමේදී දෝෂයක් ඇතිවිය.");
            }
        }
    }

    // =========================================
    // 7. YOUTUBE LINK EXTRACTION & UI UPDATE
    // =========================================
    function getYouTubeVideoId(url) {
        let videoId = null;
        const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const match = url.match(ytRegex);
        if (match && match[1]) {
            videoId = match[1];
        }
        return videoId;
    }

    // isNew කියන පැරාමීටරය අලුතින්ම එකතු කළා
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
        
        // මෙන්න මෙතනයි වෙනස වුණේ:
        if (isNew) {
            dynamicTrailers.prepend(colDiv); // ෆෝම් එකෙන් අලුතින්ම දාන එක ක්ෂණිකව උඩින්ම පෙන්වන්න
        } else {
            dynamicTrailers.append(colDiv);  // ඩේටාබේස් එකෙන් එන ඒවා පිළිවෙලට පහළට එකතු වෙන්න
        }

        // Delete Button ක්‍රියාකාරීත්වය
        const deleteBtn = colDiv.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function(e) {
            e.preventDefault(); 
            e.stopPropagation(); 
            deleteTrailerFromFirebase(docId, colDiv);
        });
    }

    loadTrailersFromFirebase();
});