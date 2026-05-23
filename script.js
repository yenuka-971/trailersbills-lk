import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs,
    deleteDoc, 
    doc        
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

    if (sessionStorage.getItem('isAdmin') === 'true') {
        document.body.classList.add('admin-mode');
    }
    
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            if (htmlElement.getAttribute('data-theme') === 'dark') {
                htmlElement.setAttribute('data-theme', 'light');
            } else {
                htmlElement.setAttribute('data-theme', 'dark');
            }
        });
    }

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

    const loginBtn = document.getElementById('loginBtn');
    const adminPasswordInput = document.getElementById('adminPassword');
    const loginError = document.getElementById('loginError');
    const addTrailerForm = document.getElementById('addTrailerForm');
    const dynamicTrailers = document.getElementById('dynamic-trailers');

    loadTrailersFromFirebase();

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

    if (addTrailerForm) {
        addTrailerForm.addEventListener('submit', async function(e) {
            e.preventDefault(); 

            const title = document.getElementById('movieTitle').value;
            const year = document.getElementById('movieYear').value;
            const image = document.getElementById('movieImage').value;
            const trailer = document.getElementById('movieTrailer').value;

            const newTrailer = { title, year, image, trailer };

            const docId = await saveTrailerToFirebase(newTrailer);

            if (docId) {
                addTrailerToUI(newTrailer, docId);
                alert('Trailer Added Successfully! 🎉');
            } else {
                alert('දෝෂයක්! දත්ත එකතු කිරීමට නොහැකි විය.');
            }

            addTrailerForm.reset();
            const dashboardModalEl = document.getElementById('adminDashboardModal');
            if (dashboardModalEl) {
                const dashboardModal = bootstrap.Modal.getInstance(dashboardModalEl);
                if(dashboardModal) dashboardModal.hide();
            }
        });
    }

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
            const querySnapshot = await getDocs(collection(db, "trailers"));
            querySnapshot.forEach((doc) => {
                addTrailerToUI(doc.data(), doc.id);
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

    // යූටියුබ් ලින්ක් එකෙන් ID එක වෙන් කරගන්නා Function එක
    function getYouTubeVideoId(url) {
        let videoId = null;
        const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        const match = url.match(ytRegex);
        if (match && match[1]) {
            videoId = match[1];
        }
        return videoId;
    }

    // HTML එකට අලුත් Movie Card එකක් එකතු කරන Function එක
    function addTrailerToUI(trailer, docId) {
        if (!dynamicTrailers) return;

        const colDiv = document.createElement('div');
        colDiv.className = 'col-6 col-md-4 col-lg-3 dynamic-movie-card';
        
        // 1. යූටියුබ් ලින්ක් එකෙන් ID එක අරගන්නවා
        const videoId = getYouTubeVideoId(trailer.trailer);
        
        // 2. ID එක තියෙනවා නම් video.html එකට යවනවා, නැත්නම් සාමාන්‍ය ලින්ක් එකට යවනවා
        const targetLink = videoId ? `video.html?id=${videoId}` : trailer.trailer;

        colDiv.innerHTML = `
            <div class="movie-card-wrapper" style="position:relative;">
                <button class="btn btn-danger btn-sm delete-btn" style="position:absolute; top:8px; right:8px; z-index:10; border-radius: 5px; padding: 4px 10px; font-size: 12px; font-weight: bold; box-shadow: 0px 2px 5px rgba(0,0,0,0.5);">
                    <i class="fas fa-trash"></i> Delete
                </button>

                <a href="${targetLink}" class="movie-card" target="_blank">
                    <div class="year-badge">${trailer.year}</div>
                    <div class="sub-badge">SINHALA SUB</div>
                    <img src="${trailer.image}" alt="Movie Poster">
                    <div class="movie-info">
                        <h5 class="movie-title">${trailer.title}</h5>
                    </div>
                </a>
            </div>
        `;
        
        dynamicTrailers.prepend(colDiv);

        // Delete බොත්තම ක්‍රියාත්මක වීම
        const deleteBtn = colDiv.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function(e) {
            e.preventDefault(); 
            e.stopPropagation(); 
            deleteTrailerFromFirebase(docId, colDiv);
        });
    }
});