// // Fetch blood requests for dashboard
// const fetchBloodRequests = async () => {

//     const token = localStorage.getItem("token");
//     if (!token) {
//         alert("Please log in first.");
//         return window.location.href = "login.html";
//     }


//     try {
//         const response = await fetch("http://localhost:3000/dashboard/blood-requests",
//             { headers:{"Authorization": "Bearer " + token}}
//         );
//         console.log(token);

//         if (response.status === 401 || response.status === 403) {
//             alert("Session expired or unauthorized. Please log in again.");
//             localStorage.removeItem("token");
//             return window.location.href = "login.html";
//         }

//         const requests = await response.json();
//         const container = document.getElementById("dashboardBloodRequests");
//         container.innerHTML = "";


//         // Update dashboard with the received blood requests
//         requests.forEach(request => {
//             const card = document.createElement("div");
//             card.classList.add("donor-card");

//             card.innerHTML = `
//                 <h3>Request by: ${request.requester_name}</h3>
//                 <p>Blood Group: ${request.blood_group}</p>
//                 <p>Date of Request: ${new Date(request.request_date).toLocaleDateString()}</p>
//             `;

//             document.getElementById("dashboardBloodRequests").appendChild(card);
//         });
//     } catch (error) {
//         console.error("Error fetching blood requests:", error);
//     }
// };

// window.onload = fetchBloodRequests;


const fetchBloodRequests = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in first.");
      return window.location.href = "login.html";
    }
  
    try {
      const response = await fetch("http://localhost:3000/dashboard/blood-requests", {
        headers: { "Authorization": "Bearer " + token }
      });
  
      if (response.status === 401 || response.status === 403) {
        alert("Session expired or unauthorized. Please log in again.");
        localStorage.removeItem("token");
        return window.location.href = "login.html";
      }
  
      const requests = await response.json();
      const container = document.getElementById("dashboardBloodRequests");
      container.innerHTML = "";
  
      requests.forEach(request => {
        const card = document.createElement("div");
        card.classList.add("donor-card");
        card.innerHTML = `
          <h3>Request by: ${request.requester_name}</h3>
          <p>Blood Group: ${request.blood_group}</p>
          <p>Date of Request: ${new Date(request.request_date).toLocaleDateString()}</p>
          <button onclick="acceptRequest(${request.id})">Accept Request</button>
        `;
        container.appendChild(card);
      });
    } catch (error) {
      console.error("Error fetching blood requests:", error);
    }
  };
  
  const acceptRequest = async (requestId) => {
    if (!confirm("Do you really want to accept this request?")) return;
  
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:3000/accept-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ requestId })
      });
  
      if (response.ok) {
        alert("Request accepted successfully!");
        fetchBloodRequests(); // Refresh the requests
        fetchDashboardCounts(); // Refresh stats
      } else {
        alert("Failed to accept request.");
      }
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };
  
  const fetchDashboardCounts = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:3000/dashboard/counts", {
        headers: { "Authorization": "Bearer " + token }
      });
  
      if (response.ok) {
        const { totalDonations, lastDonation, pendingRequests } = await response.json();
        document.getElementById("totalDonations").textContent = totalDonations;
        document.getElementById("lastDonation").textContent = lastDonation ? new Date(lastDonation).toLocaleDateString() : "N/A";
        document.getElementById("pendingRequests").textContent = pendingRequests;
      }
    } catch (error) {
      console.error("Error fetching dashboard counts:", error);
    }
  };

  async function fetchRequestSummary() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/dashboard/request-summary", {
        headers: { "Authorization": "Bearer " + token }
      });
      const summary = await res.json();
  
      const tbody = document.querySelector("#summaryTable tbody");
      tbody.innerHTML = "";  // clear any old rows
  
      summary.forEach(row => {
        tbody.innerHTML += `
          <tr>
            <td>${row.blood_group}</td>
            <td>${row.district}</td>
            <td>${row.request_count}</td>
          </tr>`;
      });
    } catch (err) {
      console.error("Error loading request summary:", err);
    }
  }
  
  
  window.onload = () => {
    fetchBloodRequests();
    fetchDashboardCounts();
    fetchRequestSummary();
  };
  