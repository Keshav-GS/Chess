const spinnerDisplayer = document.querySelector('.spinner-displayer');
const btn = document.getElementById('pairButton');

btn.addEventListener('click', async () => {
    btn.style.display = 'none';
  	spinnerDisplayer.classList.add('loading');
});
