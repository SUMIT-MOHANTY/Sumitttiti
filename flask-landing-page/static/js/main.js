async function testAPI() {
    try {
        const response = await fetch('/api/echo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Hello from Flask!' })
        });

        const data = await response.json();
        showResponse(JSON.stringify(data, null, 2));
    } catch (error) {
        showResponse('API Error: ' + error.message);
    }
}

function showResponse(content) {
    const box = document.getElementById('response-box');
    const contentDiv = document.getElementById('response-content');

    contentDiv.textContent = content;
    box.style.display = 'block';
}
