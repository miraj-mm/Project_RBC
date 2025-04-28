// Event listener for the donor registration form
document.getElementById("donorForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
        full_name: document.getElementById("name").value,
        blood_group: document.getElementById("bloodGroup").value,
        district: document.getElementById("district").value,
        police_station: document.getElementById("policeStation").value,
        contact_number: document.getElementById("contactNumber").value,
        email: document.getElementById("email").value,
        health_issues: document.getElementById("healthIssues").value,
        preferred_areas: document.getElementById("preferredAreas").value,
        username: document.getElementById("usernameRegister").value,
        password: document.getElementById("passwordRegister").value
    };

    try {
        const response = await fetch("http://localhost:3000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert("Registration successful!");
            document.getElementById("donorForm").reset();
        } else {
            alert("Error during registration.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
    }
});

// // Event listener for the login form
// document.getElementById("loginForm").addEventListener("submit", async (e) => {
//     e.preventDefault();

//     const data = {
//         username: document.getElementById("username").value,
//         password: document.getElementById("password").value
//     };

//     try {
//         const response = await fetch("http://localhost:3000/login", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(data)
//         });

//         if (response.ok) {
//             const user = await response.json();
//             alert(`Welcome, ${user.username}!`); // Fixed the welcome alert
//         } else {
//             alert("Invalid login credentials.");
//         }
//     } catch (error) {
//         console.error("Error:", error);
//         alert("An error occurred. Please try again.");
//     }
// });
