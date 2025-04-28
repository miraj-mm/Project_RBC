document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You need to log in first.");
      return window.location.href = "login.html";
    }
  
    try {
      const response = await fetch("http://localhost:3000/api/fetch-profile", {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": "Bearer " + token
        }
      });
  
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          alert("Session expired. Please log in again.");
          localStorage.removeItem("token");
          return window.location.href = "login.html";
        }
        throw new Error("Failed to fetch profile");
      }
  
      const data = await response.json();
      document.getElementById("name").value            = data.full_name;
      document.getElementById("email").value           = data.email;
      document.getElementById("phone").value           = data.contact_number;
      document.getElementById("blood-group").value     = data.blood_group;
      document.getElementById("preferred-areas").value = data.preferred_areas;
  
    } catch (error) {
      console.error("Error fetching profile:", error);
      alert("An error occurred. Please try again.");
    }
  });
  
  document.getElementById("editProfileForm").addEventListener("submit", async event => {
    event.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You need to log in first.");
      return window.location.href = "login.html";
    }
  
    const updatedData = {
      full_name:       document.getElementById("name").value,
      email:           document.getElementById("email").value,
      contact_number:  document.getElementById("phone").value,
      blood_group:     document.getElementById("blood-group").value,
      preferred_areas: document.getElementById("preferred-areas").value
    };
  
    try {
      const response = await fetch("http://localhost:3000/api/update-profile", {
        method:  "PUT",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": "Bearer " + token
        },
        body:    JSON.stringify(updatedData)
      });
  
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          alert("Session expired. Please log in again.");
          localStorage.removeItem("token");
          return window.location.href = "login.html";
        }
        throw new Error("Update failed");
      }
  
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("An error occurred. Please try again.");
    }
  });
  