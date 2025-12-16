// Simple interactions: highlight active menu and handle upload CTA
document.querySelectorAll('.menu-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.menu-item').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

const uploadAction = document.getElementById('uploadAction');
if (uploadAction) {
  uploadAction.addEventListener('click', () => {
    alert('Upload action triggered. Connect this to your upload flow.');
  });
}

