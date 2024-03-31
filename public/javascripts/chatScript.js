const socket = io();

const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');

socket.emit('get-old-messages');
socket.on('get-old-messages', async (msg) => {
    for (let message of msg) {
        const item = document.createElement('li');
        item.textContent = message;
        item.style.fontStyle = 'italic';
        messages.appendChild(item);
        window.scrollTo(0, document.body.scrollHeight);
    }
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (input.value) {
        const item = document.createElement('li');
        item.textContent = 'You: ' + input.value;
        item.style.fontWeight = 'bold';
        item.style.color = 'red';
        messages.appendChild(item);
        socket.emit('chat message', input.value);
        input.value = '';
    }
});

socket.on('chat message', async (msg) => {
    const item = document.createElement('li');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});