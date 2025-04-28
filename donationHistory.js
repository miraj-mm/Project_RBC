// donationHistory.js

const fetchDonationHistory = async () => {
    const token = localStorage.getItem("token"); // Get token from localStorage
    if (!token) {
        alert("Please log in first.");
        return window.location.href = "login.html"; // Redirect if no token
    }

    try {
        // Fetch the donation history from the server
        const response = await fetch("http://localhost:3000/donation-history", {
            headers: { "Authorization": "Bearer " + token }
        });

        if (response.status === 401 || response.status === 403) {
            alert("Session expired or unauthorized. Please log in again.");
            localStorage.removeItem("token");
            return window.location.href = "login.html"; // Redirect if unauthorized
        }

        const donationHistory = await response.json(); // Get the history data

        const historySection = document.getElementById("donation-history-section");
        historySection.innerHTML = ""; // Clear existing content

        if (donationHistory.length === 0) {
            historySection.innerHTML = "<p>No donation history found.</p>"; // Show message if no history
        } else {
            // Loop through each donation and display the details
            donationHistory.forEach(item => {
                const historyItem = document.createElement("div");
                historyItem.classList.add("history-item");
                historyItem.innerHTML = `
                    <p><strong>Date:</strong> ${new Date(item.accept_date).toLocaleDateString()}</p>
                    <p><strong>Recipient:</strong> ${item.requester_name}</p>
                    <p><strong>Blood Group:</strong> ${item.blood_group}</p>
                `;
                historySection.appendChild(historyItem); // Append the history item
            });
        }

    } catch (error) {
        console.error("Error fetching donation history:", error);
    }
};

// Fetch donation history when the page loads
window.onload = fetchDonationHistory;
