document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent form submission

    const data = {
        username: document.getElementById("username").value,
        password: document.getElementById("password").value
    };

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const user = await response.json();
            alert(`Welcome, ${user.full_name}!`);
            localStorage.setItem("token", user.token);
            // Redirect to dashboard
            window.location.href = "dashboard.html";
        } else if (response.status === 404) {
            alert("User not found. Please check your username.");
        } else if (response.status === 401) {
            alert("Invalid password. Please try again.");
        } else {
            alert("An error occurred. Please try again.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please check your internet connection.");
    }
});
