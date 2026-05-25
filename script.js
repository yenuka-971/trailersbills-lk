import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDRPro7oeI4z3faIUGoqW_xLZGF2dH-PwA",
    authDomain: "trailersbliss.firebaseapp.com",
    projectId: "trailersbliss",
    storageBucket: "trailersbliss.firebasestorage.app",
    messagingSenderId: "363232415056",
    appId: "1:363232415056:web:c832a34c61619c4e7a3055",
    measurementId: "G-NSXBVWL28C"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Preloader & Main Logic
document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Preloader Logic
    const preloader = document.getElementById('custom-preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('fade-out');
            setTimeout(() => { preloader.style.display = 'none'; }, 600);
        }, 3000);
    }

    // 2. Load Trailers from Firebase
    async function loadTrailers() {
        const container = document.getElementById('trailers-container');
        if (!container) return; // container එක නැත්නම් වැඩේ නතර කරනවා

        try {
            const querySnapshot = await getDocs(collection(db, "trailers"));
            container.innerHTML = ''; 

            querySnapshot.forEach((doc) => {
                const movie = doc.data();
                const cardHTML = `
                    <div class="col-lg-3 col-md-4 col-sm-6 mb-4 dynamic-movie-card" data-category="${movie.category}">
                        <a href="${movie.trailer}" target="_blank" class="movie-card">
                            <img src="${movie.image}" alt="${movie.title}">
                            <div class="year-badge">${movie.year}</div>
                            <div class="category-badge">${movie.category}</div>
                            <div class="movie-info">
                                <h5 class="movie-title">${movie.title}</h5>
                            </div>
                        </a>
                    </div>
                `;
                container.innerHTML += cardHTML;
            });
        } catch (error) {
            console.error("Error loading trailers: ", error);
        }
    }

    loadTrailers();

    // 3. Category Filter Logic
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
});