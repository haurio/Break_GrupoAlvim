document.addEventListener('DOMContentLoaded', () => {
    console.log('[DEBUG] Página de Login carregada.');
    const loginForm = document.querySelector('.login-form');
    if (!loginForm) {
        console.error('[ERROR] Formulário de login não encontrado!');
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const submitBtn = loginForm.querySelector('.btn-submit');
        const originalText = submitBtn.innerText;

        try {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Autenticando...';

            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Login bem-sucedido!', 'success');
                localStorage.setItem('bk_token', data.token);
                localStorage.setItem('bk_user', JSON.stringify(data.user));
                
                // Pequeno delay para o usuário ver a mensagem de sucesso
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } else {
                showToast(data.message || 'Falha na autenticação', 'error');
            }
        } catch (err) {
            console.error('[ERROR] Erro na comunicação:', err);
            showToast('Ocorreu um erro interno. Por favor, contacte o administrador do sistema.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    });
});

// ===== TOASTER SYSTEM (ESTILO NGX) =====
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px; height:20px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="12" x2="12" y2="16"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  if (type === 'success') icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px; height:20px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
  if (type === 'error') icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px; height:20px;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';

  toast.innerHTML = `
    ${icon}
    <div class="toast-msg">${message}</div>
  `;

  container.appendChild(toast);

  // Auto remove
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => {
      if (toast.parentNode) container.removeChild(toast);
      if (container.childNodes.length === 0) container.remove();
    }, 300);
  }, 3500);
}
