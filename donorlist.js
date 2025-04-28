document.addEventListener('DOMContentLoaded', () => {
    let requestsData = [];
  
    const bgSelect   = document.getElementById('bloodGroup');
    const distSelect = document.getElementById('district');
    const listEl     = document.getElementById('requestList');
    const summaryTb  = document.querySelector('#summaryTable tbody');
  

    if (bgSelect && distSelect) {
        bgSelect.addEventListener('change', applyFilters);
        distSelect.addEventListener('change', applyFilters);
      }
      
    // 1) Fetch all requests
    fetch('http://localhost:3000/getRequests')
      .then(r => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then(data => {
        requestsData = data;
        populateDistrictDropdown(data);
        renderRequests(data);
        fetchAndRenderSummary();  // show the rollup summary
      })
      .catch(err => {
        console.error(err);
        listEl.innerHTML = "<p>Error loading requests.</p>";
      });
  
    // 2) Populate districtSelect from unique districts in data
    function populateDistrictDropdown(data) {
      const districts = Array.from(new Set(data.map(r => r.district))).sort();
      districts.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d; opt.textContent = d;
        distSelect.appendChild(opt);
      });
    }
  
    // 3) Render request “cards”
    function renderRequests(data) {
      listEl.innerHTML = '';
      if (!data.length) {
        listEl.innerHTML = "<p>No requests found.</p>";
        return;
      }
      data.forEach(r => {
        const card = document.createElement('div');
        card.className = 'request-card';
        card.innerHTML = `
          <div class="request-details">
            <h2>${r.requester_name}</h2>
            <p>Blood Group: <strong>${r.blood_group}</strong></p>
            <p>District: <strong>${r.district}</strong></p>
            <p>Police Station: <strong>${r.police_station}</strong></p>
            <p>Contact: <strong>${r.requester_contact}</strong></p>
            <p>Reason: <strong>${r.reason}</strong></p>
          </div>`;
        listEl.appendChild(card);
      });
    }
  
    // 4) Live filter logic
    function applyFilters() {
      const bg   = bgSelect.value;
      const dist = distSelect.value;
      let filtered = requestsData;
  
      if (bg)   filtered = filtered.filter(r => r.blood_group === bg);
      if (dist) filtered = filtered.filter(r => r.district    === dist);
  
      renderRequests(filtered);
    }
    if (bgSelect) bgSelect.addEventListener('change', applyFilters);
    if (distSelect) distSelect.addEventListener('change', applyFilters);

  
    // 5) Fetch & render the ROLLUP summary table
    function fetchAndRenderSummary() {
      fetch('http://localhost:3000/getRequestsSummary')
        .then(r => {
          if (!r.ok) throw new Error(r.statusText);
          return r.json();
        })
        .then(rows => {
          summaryTb.innerHTML = '';
          rows.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${r.blood_group}</td>
              <td>${r.district}</td>
              <td>${r.request_count}</td>`;
            summaryTb.appendChild(tr);
          });
        })
        .catch(err => {
          console.error("Summary load error:", err);
        });
    }
  });
  