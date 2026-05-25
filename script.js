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
   
    // =========================================
    // PREMIUM PRELOADER TIMER LOGIC (EXACTLY 3 SECONDS)
    // =========================================
    const preloader = document.getElementById('custom-preloader');
    
    if (preloader) {
        setTimeout(() => {
            // තත්පර 3කට පසු 'fade-out' ක්ලාස් එක එකතු කර සුමටව අයින් කරයි
            preloader.classList.add('fade-out');
            
            // ඇනිමේෂන් එක ඉවර වුණාම සම්පූර්ණයෙන්ම display: none කරයි (නැතහොත් ක්ලික් කරන්න බැරි වේ)
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 600); // CSS වල transition එකට තත්පර 0.6ක් දුන් නිසා මෙතනට 600ms යොදයි
            
        }, 3000); // 3000ms = හරියටම තත්පර 3ක් ලෝඩින් ස්ක්‍රීන් එක පෙන්වයි
    }
    
    // =========================================
    // 1. CATEGORY FILTERING LOGIC
    // =========================================
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // බොත්තම් වල පාට මාරු කිරීම
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const selectedCategory = this.getAttribute('data-filter');
            const allMovieCards = document.querySelectorAll('.dynamic-movie-card');
            
            // ෆිල්ම් කාඩ් ෆිල්ටර් කිරීම
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

    // මුලින්ම වෙබ්සයිට් එකට එද්දී Dark Mode එකෙන් පටන් ගන්න
    if (!htmlElement.getAttribute('data-theme')) {
        htmlElement.setAttribute('data-theme', 'dark'); 
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', function(e) {
            e.preventDefault(); 
            
            // මේකෙන් තමයි CSS වලට සිග්නල් එක දෙන්නේ බෝලේ එහාට මෙහාට යවන්න කියලා!
            this.classList.toggle('active');
            
            // Theme එක මාරු කරන කොටස
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