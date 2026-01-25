const API_URL = '/.netlify/functions/manageJobs';

document.addEventListener('DOMContentLoaded', () => {
    // Initial Load
    if (document.getElementById('jobListBody')) {
        loadJobs();
    }

    // --- 1. Navigation Logic ---
    window.showSection = (sectionId, navItem) => {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.style.display = 'none';
        });

        // Remove active class from all nav items
        document.querySelectorAll('.sidebar nav li').forEach(li => {
            li.classList.remove('active');
        });

        // Show selected section
        document.getElementById(sectionId).style.display = 'block';
        navItem.classList.add('active');

        // Refresh lists if needed
        if (sectionId === 'list-jobs') {
            loadJobs();
        }
    };

    // --- Mock Data for Local Fallback ---
    const MOCK_DB_KEY = 'mock_jobs_db';
    const INITIAL_MOCK_DATA = [
        {
            id: 1,
            title: "तल्हाठी भरती 2025 - ४०००+ जागांसाठी जाहिरात प्रसिद्ध",
            department: "महाराष्ट्र शासन (Revenue Dept)",
            last_date: "2025-01-30",
            short_desc: "महसूल विभागांतर्गत तलाठी पदासाठी बंपर भरती सुरू झाली आहे.",
            status: "Active",
            created_at: new Date().toISOString()
        },
        {
            id: 2,
            title: "भारतीय रेल्वे भरती 2025",
            department: "Indian Railways (RRB)",
            last_date: "2025-02-15",
            short_desc: "रेल्वे रिक्रूटमेंट बोर्ड (RRB) ने गट ड पदांसाठी अर्ज मागवले आहेत.",
            status: "Active",
            created_at: new Date().toISOString()
        }
    ];

    // Helper to get local data
    const getLocalJobs = () => {
        const stored = localStorage.getItem(MOCK_DB_KEY);
        return stored ? JSON.parse(stored) : INITIAL_MOCK_DATA;
    };

    // Helper to save local data
    const saveLocalJobs = (jobs) => {
        localStorage.setItem(MOCK_DB_KEY, JSON.stringify(jobs));
    };

    // --- 2. Add Job Form Submission ---
    const jobForm = document.getElementById('jobForm');
    if (jobForm) {
        jobForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = jobForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = 'Publishing...';
            submitBtn.disabled = true;

            // Collect Form Data
            const jobData = {
                title: document.getElementById('jobTitle').value,
                department: document.getElementById('department').value,
                location: document.getElementById('location').value,
                vacancy: document.getElementById('vacancy').value,
                salary: document.getElementById('salary').value,
                last_date: document.getElementById('lastDate').value,
                apply_link: document.getElementById('applyLink').value,
                short_desc: document.getElementById('shortDesc').value,
                full_desc: document.getElementById('fullDesc').value,
                status: 'Active'
            };

            try {
                // Try Server First
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(jobData)
                });

                if (!response.ok) throw new Error('Backend failed');

                const result = await response.json();
                alert('Job Posted Successfully (Server)!');

            } catch (error) {
                console.warn('Backend unavailable, saving locally:', error);

                // --- Local Fallback ---
                const currentJobs = getLocalJobs();
                const newJob = {
                    ...jobData,
                    id: Date.now(), // Simple ID generation
                    created_at: new Date().toISOString()
                };
                currentJobs.unshift(newJob); // Add to top
                saveLocalJobs(currentJobs);

                alert('Job Posted Successfully (Local Mode)!');
            } finally {
                jobForm.reset();
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;

                // If logic to switch tab exists:
                // window.showSection('list-jobs', document.querySelectorAll('.sidebar nav li')[1]);
            }
        });
    }

    // --- 3. Load Jobs into Table ---
    async function loadJobs() {
        const tbody = document.getElementById('jobListBody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Loading jobs...</td></tr>';

        let jobs = [];

        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Failed to fetch jobs');
            jobs = await response.json();
        } catch (error) {
            console.warn('Using Local Data Fallback due to error:', error);
            jobs = getLocalJobs();
        }

        // Render Jobs
        tbody.innerHTML = '';

        if (!jobs || jobs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">No jobs found. Add your first job!</td></tr>';
            return;
        }

        jobs.forEach(job => {
            const tr = document.createElement('tr');

            const dateObj = new Date(job.last_date);
            const dateStr = !isNaN(dateObj) ? dateObj.toLocaleDateString('en-IN') : job.last_date;

            tr.innerHTML = `
                <td>#${job.id}</td>
                <td><strong>${escapeHtml(job.title)}</strong></td>
                <td>${escapeHtml(job.department)}</td>
                <td>${dateStr}</td>
                <td><span class="status-active">${job.status || 'Active'}</span></td>
                <td>
                    <button class="btn-delete" onclick="deleteJob(${job.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // --- 4. Delete Job Function ---
    window.deleteJob = async (id) => {
        if (!confirm('Are you sure you want to delete this job permanently?')) return;

        try {
            // Try Server
            const response = await fetch(API_URL, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });

            if (!response.ok) throw new Error('Backend failed');

            loadJobs(); // Refresh

        } catch (error) {
            console.warn('Backend unavailable, deleting locally:', error);

            // --- Local Fallback ---
            let currentJobs = getLocalJobs();
            currentJobs = currentJobs.filter(j => j.id !== id);
            saveLocalJobs(currentJobs);

            alert('Job deleted locally.');
            loadJobs(); // Refresh
        }
    };

    // Helper to prevent XSS
    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // --- 5. Ad Management Logic (Local Storage Fallback) ---
    // In a real app, this would upload to Supabase Storage/S3 and save URL to DB

    const adsForm = document.getElementById('adsForm');
    if (adsForm) {
        // Load existing ads
        loadSavedAds();

        adsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = adsForm.querySelector('button[type="submit"]');
            submitBtn.innerText = 'Saving...';

            try {
                const adsConfig = JSON.parse(localStorage.getItem('site_ads_config') || '{}');

                // Helper to read file
                const readFile = (id) => new Promise((resolve) => {
                    const input = document.getElementById(id);
                    if (input.files && input.files[0]) {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result); // Base64
                        reader.readAsDataURL(input.files[0]);
                    } else {
                        resolve(null); // No new file selected
                    }
                });

                // Process inputs
                const topBanner = await readFile('adTopBanner');
                const sidebar1 = await readFile('adSidebar1');
                const sidebar2 = await readFile('adSidebar2');

                // Update config only if new file provided
                if (topBanner) adsConfig.topBanner = topBanner;
                if (sidebar1) adsConfig.sidebar1 = sidebar1;
                if (sidebar2) adsConfig.sidebar2 = sidebar2;

                localStorage.setItem('site_ads_config', JSON.stringify(adsConfig));

                alert('Ad Banners Saved Locally! Refresh the main website to see changes.');
                loadSavedAds(); // Refresh previews

            } catch (err) {
                console.error(err);
                alert('Error processing images.');
            } finally {
                submitBtn.innerText = 'Save Ad Settings';
            }
        });

        // Clear Ads Button
        document.getElementById('clearAdsBtn').addEventListener('click', () => {
            if (confirm('Remove all custom ad banners?')) {
                localStorage.removeItem('site_ads_config');
                location.reload();
            }
        });
    }

    function loadSavedAds() {
        const adsConfig = JSON.parse(localStorage.getItem('site_ads_config') || '{}');

        const showPreview = (imgData, previewId) => {
            const el = document.getElementById(previewId);
            const img = el.querySelector('img');
            if (imgData) {
                img.src = imgData;
                el.style.display = 'block';
            } else {
                el.style.display = 'none';
            }
        };

        if (adsConfig.topBanner) showPreview(adsConfig.topBanner, 'previewTopBanner');
        if (adsConfig.sidebar1) showPreview(adsConfig.sidebar1, 'previewSidebar1');
        if (adsConfig.sidebar2) showPreview(adsConfig.sidebar2, 'previewSidebar2');
    }



    // --- 6. Logout Logic ---
    const logoutBtn = document.querySelector('.logout a');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('admin_auth');
                window.location.href = 'login.html';
            }
        });
    }

});
