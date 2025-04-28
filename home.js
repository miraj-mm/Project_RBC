document.getElementById('requestForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    
    const formData = {
            bloodGroup: document.getElementById('bloodGroup').value,
            requesterName: document.getElementById('requesterName').value,
            requesterContact: document.getElementById('requesterContact').value,
            district: document.getElementById('district').value,
            policeStation: document.getElementById('policeStation').value,
            reason: document.getElementById('reason').value,
    };

    try {
        const response = await fetch('http://localhost:3000/request-blood', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        // Log the raw response for debugging
        console.log('Raw response:', response);

        const result = await response.json();
        console.log('Parsed result:', result);

        if (response.ok) {
            alert(result.message);
            //document.getElementById('requestForm').reset();
        } else {
            // Handle the error response more specifically
            alert('Error: ' + result.message + (result.error ? ` - ${result.error}` : ''));
        }
    } catch (err) {
        alert('An error occurred. Please try again later.');
        console.error('Fetch error details:', err);
    }
});
