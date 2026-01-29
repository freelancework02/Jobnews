const API_URL = '/api/manageJobs';

let isEditing = false;
let editingId = null;
let allJobs = [];

document.addEventListener('DOMContentLoaded', () => {
    // Initial Load
    if (document.getElementById('jobListBody')) {
        loadJobs();
    }

    // --- 1. Navigation Logic ---
    window.showSection = (sectionId, navItem) => {
        // If clicking "Add Job" while in edit mode, decide whether to reset.
        // Usually, if the user explicitly clicks "Add Job Post" in the sidebar, they want a fresh form.
        if (sectionId === 'add-job' && isEditing && navItem) {
            resetFormState();
        }

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
            title: "तल्हाठी भरती 2026 - ४०००+ जागांसाठी जाहिरात प्रसिद्ध",
            department: "महाराष्ट्र शासन (Revenue Dept)",
            last_date: "2026-01-30",
            short_desc: "महसूल विभागांतर्गत तलाठी पदासाठी बंपर भरती सुरू झाली आहे.",
            status: "Active",
            created_at: new Date().toISOString()
        },
        {
            id: 2,
            title: "भारतीय रेल्वे भरती 2026",
            department: "Indian Railways (RRB)",
            last_date: "2026-02-15",
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

    // --- 2. Add / Edit Job Form Submission ---
    const jobForm = document.getElementById('jobForm');
    if (jobForm) {
        jobForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = jobForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = isEditing ? 'Updating...' : 'Publishing...';
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

            if (isEditing) {
                jobData.id = editingId; // Add ID for update
            }

            try {
                // Try Server First
                const method = isEditing ? 'PUT' : 'POST';
                const response = await fetch(API_URL, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(jobData)
                });

                if (!response.ok) throw new Error('Backend failed');

                const result = await response.json();
                alert(isEditing ? 'Job Updated Successfully!' : 'Job Posted Successfully!');

            } catch (error) {
                console.warn('Backend unavailable, saving locally:', error);

                // --- Local Fallback ---
                let currentJobs = getLocalJobs();

                if (isEditing) {
                    // Update existing
                    const index = currentJobs.findIndex(j => j.id == editingId);
                    if (index !== -1) {
                        currentJobs[index] = { ...currentJobs[index], ...jobData };
                    }
                } else {
                    // Create new
                    const newJob = {
                        ...jobData,
                        id: Date.now(), // Simple ID generation
                        created_at: new Date().toISOString()
                    };
                    currentJobs.unshift(newJob);
                }

                saveLocalJobs(currentJobs);

                alert(isEditing ? 'Job Updated Successfully (Local)!' : 'Job Posted Successfully (Local Mode)!');
            } finally {
                resetFormState();
                submitBtn.disabled = false;

                // Optional: switch to list view after save
                // window.showSection('list-jobs', document.querySelectorAll('.sidebar nav li')[1]);
            }
        });
    }

    function resetFormState() {
        // Reset Variables
        isEditing = false;
        editingId = null;

        // Reset UI
        const jobForm = document.getElementById('jobForm');
        if (jobForm) {
            jobForm.reset();
            const submitBtn = jobForm.querySelector('button[type="submit"]');
            submitBtn.innerText = 'Publish Job';
        }

        const cardHeader = document.querySelector('#add-job .card-header h3');
        if (cardHeader) cardHeader.innerText = 'Create New Job Post';
    }

    // --- 3. Load Jobs into Table ---
    async function loadJobs() {
        const tbody = document.getElementById('jobListBody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Loading jobs...</td></tr>';

        allJobs = []; // Reset global cache

        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Failed to fetch jobs');
            allJobs = await response.json();
        } catch (error) {
            console.warn('Using Local Data Fallback due to error:', error);
            allJobs = getLocalJobs();
        }

        // Render Jobs
        tbody.innerHTML = '';

        if (!allJobs || allJobs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">No jobs found. Add your first job!</td></tr>';
            return;
        }

        allJobs.forEach(job => {
            const tr = document.createElement('tr');

            const dateObj = new Date(job.last_date);
            const dateStr = !isNaN(dateObj) ? dateObj.toLocaleDateString('en-IN') : job.last_date;

            // Inline styles for Edit button to match user request (side by side)
            tr.innerHTML = `
                <td>#${job.id}</td>
                <td><strong>${escapeHtml(job.title)}</strong></td>
                <td>${escapeHtml(job.department)}</td>
                <td>${dateStr}</td>
                <td><span class="status-active">${job.status || 'Active'}</span></td>
                <td>
                    <button class="btn-edit" onclick="editJob(${job.id})" 
                        style="background: #ffc107; color: #000; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-delete" onclick="deleteJob(${job.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // --- 4. Edit Job Function ---
    window.editJob = async (id) => {
        // Find job in the globally cached list
        const job = allJobs.find(j => j.id == id);

        if (!job) {
            alert('Job data not found!');
            return;
        }

        // Switch to Add/Edit Section
        // Find the "Add Job Post" nav item
        const addJobNavItem = document.querySelector('.sidebar nav li[onclick*="add-job"]');
        window.showSection('add-job', addJobNavItem);

        // Populate Form
        document.getElementById('jobTitle').value = job.title || '';
        document.getElementById('department').value = job.department || '';
        document.getElementById('location').value = job.location || '';
        document.getElementById('vacancy').value = job.vacancy || '';
        document.getElementById('salary').value = job.salary || '';

        // Handle Date (Format: YYYY-MM-DD for input type="date")
        if (job.last_date) {
            const d = new Date(job.last_date);
            if (!isNaN(d)) {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                document.getElementById('lastDate').value = `${yyyy}-${mm}-${dd}`;
            } else {
                document.getElementById('lastDate').value = job.last_date;
            }
        }

        document.getElementById('applyLink').value = job.apply_link || '';
        document.getElementById('shortDesc').value = job.short_desc || '';
        document.getElementById('fullDesc').value = job.full_desc || '';

        // Update UI State to Edit Mode
        isEditing = true;
        editingId = id;

        document.querySelector('#add-job .card-header h3').innerText = 'Edit Job Post';
        const submitBtn = document.querySelector('#jobForm button[type="submit"]');
        submitBtn.innerText = 'Update Job';

        // Scroll to top
        window.scrollTo(0, 0);
    };

    // --- 5. Delete Job Function ---
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
            currentJobs = currentJobs.filter(j => j.id != id); // loose equality for string/number safety
            saveLocalJobs(currentJobs);

            alert('Job deleted locally.');
            loadJobs(); // Refresh
        }
    };

    // Helper to prevent XSS
    function escapeHtml(text) {
        if (!text) return '';
        return text
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // --- 6. Ad Management Logic (Local Storage Fallback) ---
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

    // --- 7. Logout Logic ---
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
