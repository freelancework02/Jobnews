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
            // Ensure these keys match your Supabase columns exactly
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

            console.log("Sending Data:", jobData);

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(jobData)
                });

                const result = await response.json();

                if (response.ok) {
                    alert('Job Posted Successfully!');
                    jobForm.reset();
                    // Optional: Switch to list view
                    // window.showSection('list-jobs', document.querySelectorAll('.sidebar nav li')[1]);
                } else {
                    console.error('Server Error:', result);
                    alert('Error: ' + (result.error || 'Failed to post job. Check console.'));
                }
            } catch (error) {
                console.error('Network Error:', error);
                alert('Network error. Failed to connect to server.');
            } finally {
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    // --- 3. Load Jobs into Table ---
    async function loadJobs() {
        const tbody = document.getElementById('jobListBody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Loading jobs from database...</td></tr>';

        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Failed to fetch jobs');

            const jobs = await response.json();
            tbody.innerHTML = ''; // Clear loading message

            if (!jobs || jobs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">No jobs found. Add your first job!</td></tr>';
                return;
            }

            jobs.forEach(job => {
                const tr = document.createElement('tr');

                // Format Date nicely
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

        } catch (error) {
            console.error('Error loading jobs:', error);
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red; padding: 20px;">Error loading jobs. Ensure backend is running.</td></tr>';
        }
    }

    // --- 4. Delete Job Function ---
    window.deleteJob = async (id) => {
        if (!confirm('Are you sure you want to delete this job permanently?')) return;

        try {
            const response = await fetch(API_URL, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });

            if (response.ok) {
                // Refresh the list
                loadJobs();
            } else {
                const res = await response.json();
                alert('Failed to delete: ' + (res.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Delete Error:', error);
            alert('Network error while deleting.');
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
});
