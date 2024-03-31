const actualBtn = document.getElementById('actual-btn');
const fileChosen = document.getElementById('file-chosen');
const messageContainer = document.getElementById('message');
const imagesContainer = document.querySelector('.images');
const predictBtn = document.querySelector('.button');

predictBtn.style.display = 'none';

actualBtn.addEventListener('change', function() {
    if (this.files.length > 0) {
        const file = this.files[0];
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
            fileChosen.textContent = file.name;
            showMessage('Upload Successful!!', true);
            displayImage(file);
            predictBtn.style.display = 'inline-block';
        } else {
            showMessage('Please upload only images of form .jpg, .jpeg', false);
            predictBtn.style.display = 'none';
        }
    } else {
        fileChosen.textContent = 'No file chosen';
        predictBtn.style.display = 'none';
    }
});

predictBtn.addEventListener('click', async function() {
    if (actualBtn.files.length > 0) {
        const file = actualBtn.files[0];
        await processImage(file);
    } else {
        showMessage('Please choose a file', false);
    }
});

function showMessage(message, isSuccess) {
    messageContainer.textContent = '';
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.classList.add(isSuccess ? 'success' : 'error');
    messageContainer.appendChild(messageElement);
}

function displayImage(file) {
    const imgElement = document.createElement('img');
    imgElement.src = URL.createObjectURL(file);
    imgElement.alt = 'Uploaded Image';
    imagesContainer.innerHTML = '';
    imagesContainer.appendChild(imgElement);
}
async function processImage(image) {
    try {
        const formData = new FormData();
        formData.append('image', image);
        const response = await fetch('/ChessWebsite/boardToFen/process_image', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const fen = await response.text();
            console.log('Predicted FEN:', fen);
            let k=0;
            let str='';
            for(let i=0;i<fen.length;i++){
               if(fen[i]==='p'){
                for(let h=i+1;h<fen.length;h++){
                    str += fen[h];
                }
                break;
               }
            }
            document.getElementById('output').textContent = str; // Display FEN in the output div
        } else {
            showMessage('Error processing image.', false);
        }
    } catch (error) {
        showMessage('Error processing image.', false);
        console.error('Error:', error);
    }
}

