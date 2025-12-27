// document.addEventListener('DOMContentLoaded', () => {

//     // 1. Navigation Logic (Switching Tabs)
//     window.showSection = (sectionId, navItem) => {
//         // Hide all sections
//         document.querySelectorAll('.content-section').forEach(sec => {
//             sec.style.display = 'none';
//         });

//         // Remove active class from all nav items
//         document.querySelectorAll('.sidebar nav li').forEach(li => {
//             li.classList.remove('active');
//         });

//         // Show selected section
//         document.getElementById(sectionId).style.display = 'block';
//         navItem.classList.add('active');

//         // Refresh lists if needed
//         if (sectionId === 'list-jobs') {
//             loadJobs();
//         }
//     };

//     // 2. Add Job Form Submission
//     const jobForm = document.getElementById('jobForm');
//     jobForm.addEventListener('submit', (e) => {
//         e.preventDefault();

//         // Collect Form Data
//         const jobData = {
//             id: Date.now(), // Unique ID based on timestamp
//             title: document.getElementById('jobTitle').value,
//             department: document.getElementById('department').value,
//             location: document.getElementById('location').value,
//             vacancy: document.getElementById('vacancy').value,
//             salary: document.getElementById('salary').value,
//             lastDate: document.getElementById('lastDate').value,
//             applyLink: document.getElementById('applyLink').value,
//             shortDesc: document.getElementById('shortDesc').value,
//             fullDesc: document.getElementById('fullDesc').value,
//             status: 'Active',
//             datePosted: new Date().toISOString().split('T')[0]
//         };

//         // Save to LocalStorage (simulating Database)
//         let jobs = JSON.parse(localStorage.getItem('myJobPortal_jobs')) || [];
//         jobs.push(jobData);
//         localStorage.setItem('myJobPortal_jobs', JSON.stringify(jobs));

//         alert('Job Posted Successfully!');
//         jobForm.reset();
//     });

//     // 3. Load Jobs into Table
//     function loadJobs() {
//         const tbody = document.getElementById('jobListBody');
//         tbody.innerHTML = ''; // Clear current list

//         const jobs = JSON.parse(localStorage.getItem('myJobPortal_jobs')) || [];

//         if (jobs.length === 0) {
//             tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No jobs found. Add one!</td></tr>';
//             return;
//         }

//         jobs.forEach(job => {
//             const tr = document.createElement('tr');
//             tr.innerHTML = `
//                 <td>#${job.id}</td>
//                 <td><strong>${job.title}</strong></td>
//                 <td>${job.department}</td>
//                 <td>${job.lastDate}</td>
//                 <td><span class="status-active">${job.status}</span></td>
//                 <td>
//                     <button class="btn-delete" onclick="deleteJob(${job.id})">Delete</button>
//                 </td>
//             `;
//             tbody.appendChild(tr);
//         });
//     }

//     // 4. Delete Job Function
//     window.deleteJob = (id) => {
//         if (confirm('Are you sure you want to delete this job?')) {
//             let jobs = JSON.parse(localStorage.getItem('myJobPortal_jobs')) || [];
//             jobs = jobs.filter(job => job.id !== id);
//             localStorage.setItem('myJobPortal_jobs', JSON.stringify(jobs));
//             loadJobs(); // Refresh table
//         }
//     };
// });







document.addEventListener('DOMContentLoaded', () => {

    // --- Configuration ---
    // This points to your Netlify Function (which talks to Supabase)
    const API_URL = '/api/manageJobs';

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
            submitBtn.innerText = 'Posting...';
            submitBtn.disabled = true;

            // Collect Form Data 
            // NOTE: Keys match Supabase column names (snake_case)
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
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(jobData)
                });

                const result = await response.json();

                if (response.ok) {
                    alert('Job Posted Successfully!');
                    jobForm.reset();
                } else {
                    alert('Error: ' + (result.error || 'Failed to post job'));
                }
            } catch (error) {
                console.error('Error posting job:', error);
                alert('Network error. Check console.');
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

        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Loading active jobs...</td></tr>';

        try {
            const response = await fetch(API_URL); // GET request

            if (!response.ok) throw new Error('Failed to fetch');

            const jobs = await response.json();

            tbody.innerHTML = ''; // Clear loading message

            if (!jobs || jobs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No jobs found. Add one!</td></tr>';
                return;
            }

            jobs.forEach(job => {
                const tr = document.createElement('tr');
                // Note: Using job.id and job.last_date (snake_case from Supabase)
                tr.innerHTML = `
                    <td>#${job.id}</td>
                    <td><strong>${job.title}</strong></td>
                    <td>${job.department}</td>
                    <td>${job.last_date || 'N/A'}</td>
                    <td><span class="status-active">${job.status}</span></td>
                    <td>
                        <button class="btn-delete" onclick="deleteJob(${job.id})">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

        } catch (error) {
            console.error('Error loading jobs:', error);
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Error loading jobs. Try refreshing.</td></tr>';
        }
    }

    // --- 4. Delete Job Function ---
    window.deleteJob = async (id) => {
        if (confirm('Are you sure you want to delete this job permanently?')) {
            try {
                // Optimistic UI update (optional): could remove row immediately
                const response = await fetch(API_URL, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: id })
                });

                if (response.ok) {
                    // Reload list to confirm deletion
                    loadJobs();
                } else {
                    alert('Failed to delete job.');
                }
            } catch (error) {
                console.error('Error deleting job:', error);
                alert('Network error while deleting.');
            }
        }
    };

});
