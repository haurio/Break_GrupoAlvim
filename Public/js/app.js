// ===== API & AUTH SYSTEM =====
const API_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('bk_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function apiFetch(endpoint, options = {}) {
  console.log(`[API CALL] Chamando ${endpoint}...`);
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...options.headers
    };
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    console.log(`[API RESPONSE] ${endpoint} Status: ${response.status}`);
    
    if (response.status === 401 || response.status === 403) {
      console.warn('[AUTH] Sessão expirada ou acesso negado. Fazendo logout.');
      localStorage.removeItem('bk_token');
      window.location.href = '/login';
      return null;
    }
    const data = await response.json();
    console.log(`[API DATA] Recebido de ${endpoint}:`, data);
    return data;
  } catch (err) {
    console.error(`[API ERROR] Falha ao comunicar com ${endpoint}:`, err);
    showToast('Ocorreu um erro interno. Por favor, contacte o administrador do sistema.', 'error');
    return null;
  }
}

function checkAuth() {
  const token = localStorage.getItem('bk_token');
  if (!token && !window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
  const user = JSON.parse(localStorage.getItem('bk_user') || '{}');
  const userNameEl = document.querySelector('.user-name strong');
  const userUnitEl = document.getElementById('header-unit-name');
  if (userNameEl) userNameEl.textContent = user.nome || 'Admin';
  if (userUnitEl) userUnitEl.innerHTML = `Unidade: <strong>${user.loja_nome || 'Grupo Alvim'}</strong>`;

  // Controle de visibilidade da aba de usuários
  const tabUser = document.getElementById('nav-tab-user');
  if (tabUser) {
    const isAdminOrDirector = user.role === 'Administrador' || user.role === 'Diretor';
    tabUser.style.display = isAdminOrDirector ? 'flex' : 'none';
  }
}

// ===== TOASTER SYSTEM (ESTILO NGX 2026) =====
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
  if (type === 'success') {
    icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px; height:20px; color:#27ae60;"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  } else if (type === 'error') {
    icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px; height:20px; color:var(--bk-red);"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
  }

  toast.innerHTML = `${icon}<div class="toast-msg">${message}</div>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// ===== RELÓGIO EM TEMPO REAL =====
function updateClock() {
  const now = new Date();
  const day   = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year  = now.getFullYear();
  const clockDate = document.getElementById('clock-date');
  if (clockDate) clockDate.textContent = `${day}/${month}/${year}`;

  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const clockTime = document.getElementById('clock-time');
  if (clockTime) clockTime.textContent = `${h}:${m}:${s}`;
}
updateClock();
setInterval(updateClock, 1000);

// ===== NAVEGAÇÃO ENTRE ABAS =====
function switchTab(event, tabId, btnElement) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const dropdown = document.getElementById('bk-dropdown');
  if (dropdown) dropdown.classList.remove('show');

  const panes = document.querySelectorAll('.tab-pane');
  panes.forEach(pane => pane.classList.remove('active'));

  const btns = document.querySelectorAll('.tab-btn');
  btns.forEach(btn => btn.classList.remove('active'));

  const target = document.getElementById(tabId);
  if (target) target.classList.add('active');
  if (btnElement) btnElement.classList.add('active');

  // Atualizar título da página dinamicamente
  let pageTitle = 'Gestão Break';
  if (tabId === 'tab-colaboradores') pageTitle += ' - Colaboradores';
  else if (tabId === 'tab-user') pageTitle += ' - Usuários';
  else if (tabId === 'tab-home') pageTitle += ' - Registro Consumo';
  else if (tabId === 'tab-consumos') pageTitle += ' - Histórico';
  else if (tabId === 'tab-produtos') pageTitle += ' - Produtos';
  document.title = pageTitle;
}

function switchSubTab(subPaneId, btnElement) {
  const parentPane = btnElement.closest('.tab-pane');
  if (!parentPane) return;
  const subPanes = parentPane.querySelectorAll('.sub-pane');
  subPanes.forEach(pane => pane.classList.remove('active'));
  const btns = parentPane.querySelectorAll('.sub-tab-btn');
  btns.forEach(b => b.classList.remove('active'));
  const target = document.getElementById(subPaneId);
  if (target) target.classList.add('active');
  btnElement.classList.add('active');
}

function toggleMenu(event) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById('bk-dropdown');
  dropdown.classList.toggle('show');
}

// ===== CUSTOM BK SELECT (ÍCONES + TEXTO) =====
function toggleBKSelect(event, containerId) {
  if (event) event.stopPropagation();

  // Fechar todos os outros seletores abertos
  document.querySelectorAll('.bk-select-options').forEach(opt => {
    if (opt.id !== `${containerId}-options`) {
      opt.style.display = 'none';
    }
  });

  const options = document.getElementById(`${containerId}-options`);
  if (!options) return;

  const isVisible = options.style.display === 'block';
  options.style.display = isVisible ? 'none' : 'block';

  const triggerInput = document.getElementById(`${containerId}-input`);

  if (!isVisible) {
    if (triggerInput) {
      triggerInput.removeAttribute('readonly');
      triggerInput.value = '';
      filterBKOptions(triggerInput); // reseta visualização
      setTimeout(() => triggerInput.focus(), 50);
    }
  } else {
    // Restaurar campo após fechamento se houver
    if (triggerInput) {
      triggerInput.setAttribute('readonly', 'true');
      const hidden = document.getElementById(`${containerId}-hidden`);
      triggerInput.value = hidden && hidden.value ? (triggerInput.dataset.text || '') : '';
    }
  }
}

// Filtro interno para o dropdown
function filterBKOptions(inputElement) {
  // O input está dentro de .bk-select-trigger, não de .bk-select-options
  // Por isso navegamos até .bk-select e depois encontramos .bk-select-options
  const bkSelect = inputElement.closest('.bk-select');
  if (!bkSelect) return;
  const optionsContainer = bkSelect.querySelector('.bk-select-options');
  if (!optionsContainer) return;

  const filter = inputElement.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const options = optionsContainer.querySelectorAll('.bk-select-option');
  const groups = optionsContainer.querySelectorAll('.bk-group-label');
  
  options.forEach(opt => {
    const text = opt.innerText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (text.includes(filter)) {
      opt.style.display = ''; 
    } else {
      opt.style.display = 'none';
    }
  });

  // Ocultar cabeçalhos de categorias (.bk-group-label) que não têm produtos visíveis
  groups.forEach(group => {
    let nextEl = group.nextElementSibling;
    let hasVisibleOption = false;
    while(nextEl && !nextEl.classList.contains('bk-group-label')) {
      if(nextEl.classList.contains('bk-select-option') && nextEl.style.display !== 'none') {
        hasVisibleOption = true;
        break;
      }
      nextEl = nextEl.nextElementSibling;
    }
    group.style.display = hasVisibleOption ? 'block' : 'none';
  });
}

let currentSelectedItem = null;
let currentSelectedType = null;
let currentSelectedId = null; // Guardar ID real para exclusão/edição
let currentItemElementId = null;

// ===== SISTEMA DE CONFIRMAÇÃO CUSTOMIZADO =====
let confirmResolve = null;

function showConfirm(message) {
  const modal = document.getElementById('confirm-modal');
  const msgEl = document.getElementById('confirm-msg');
  if (!modal || !msgEl) return Promise.resolve(false);

  msgEl.innerText = message;
  modal.style.display = 'flex';

  return new Promise((resolve) => {
    confirmResolve = resolve;
  });
}

function resolveConfirm(choice) {
  const modal = document.getElementById('confirm-modal');
  if (modal) modal.style.display = 'none';
  if (confirmResolve) {
    confirmResolve(choice);
    confirmResolve = null;
  }
}

function openEditModal(type, id, name, arg3, arg4, arg5, arg6) {
  currentSelectedType = type;
  currentSelectedId = id;
  currentSelectedItem = name;
  const modal = document.getElementById('edit-modal');
  const container = document.getElementById('modal-fields-container');
  const checkStatus = document.getElementById('modal-checkbox-status');
  
  // Localizar o item na lista para poder mudar a classe visual dps
  currentItemElementId = null;
  document.querySelectorAll('.list-item').forEach(item => {
    if (item.getAttribute('onclick')?.includes(`'${id}'`)) currentItemElementId = item;
  });

  let fieldsHtml = '';

  if (type === 'Colaborador') {
    let turnoLabel = 'Manhã';
    if (arg4 === 'tarde') turnoLabel = 'Tarde';
    else if (arg4 === 'noite') turnoLabel = 'Noite';

    fieldsHtml = `
      <div class="form-group"><label class="form-label">Nome</label><input type="text" class="input-field" id="modal-name" value="${name}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Cargo</label>
          <div class="bk-select" id="m-cargo"><div class="bk-select-trigger" id="m-cargo-trigger" onclick="toggleBKSelect(event,'m-cargo')"><span>${arg5 || 'Operador'}</span></div><input type="hidden" id="m-cargo-hidden" value="${arg5}"><div class="bk-select-options shadow-lg" id="m-cargo-options"><div class="bk-select-option" onclick="selectBKOption('Gerente','Gerente','','m-cargo')">Gerente</div><div class="bk-select-option" onclick="selectBKOption('Sub-Gerente','Sub-Gerente','','m-cargo')">Sub-Gerente</div><div class="bk-select-option" onclick="selectBKOption('Operador','Operador','','m-cargo')">Operador</div></div></div>
        </div>
        <div class="form-group"><label class="form-label">Turno</label>
          <div class="bk-select" id="m-shift"><div class="bk-select-trigger" id="m-shift-trigger" onclick="toggleBKSelect(event,'m-shift')"><span>${turnoLabel}</span></div><input type="hidden" id="m-shift-hidden" value="${arg4 || 'manha'}"><div class="bk-select-options shadow-lg" id="m-shift-options"><div class="bk-select-option" onclick="selectBKOption('manha','Manhã','','m-shift')">Manhã</div><div class="bk-select-option" onclick="selectBKOption('tarde','Tarde','','m-shift')">Tarde</div><div class="bk-select-option" onclick="selectBKOption('noite','Noite','','m-shift')">Noite</div></div></div>
        </div>
      </div>
      <div class="form-group"><label class="form-label">Unidade / Estabelecimento</label>
        <div class="bk-select" id="m-store">
          <div class="bk-select-trigger" id="m-store-trigger" onclick="toggleBKSelect(event,'m-store')"><span>Carregando...</span></div>
          <input type="hidden" id="m-store-hidden" value="${arg3}">
          <div class="bk-select-options shadow-lg" id="m-store-options" style="bottom: 100%; top: auto;">
            <!-- Populado dinamicamente -->
          </div>
        </div>
      </div>
    `;
    setTimeout(() => {
        const modalStoreOpts = document.getElementById('m-store-options');
        const mainStoreOpts = document.getElementById('loja-colab-options');
        if (modalStoreOpts && mainStoreOpts) {
            modalStoreOpts.innerHTML = mainStoreOpts.innerHTML.replace(/loja-colab/g, 'm-store');
            const options = Array.from(modalStoreOpts.querySelectorAll('.bk-select-option'));
            const currentOpt = options.find(opt => opt.getAttribute('onclick')?.includes(`'${arg3}'`));
            if (currentOpt) document.getElementById('m-store-trigger').innerHTML = `<span>${currentOpt.innerText}</span>`;
            else document.getElementById('m-store-trigger').innerHTML = `<span>Selecione a Unidade</span>`;
        }
    }, 20);
  } else if (type === 'Produto') {
    fieldsHtml = `
      <div class="form-group"><label class="form-label">Nome do Produto</label><input type="text" class="input-field" id="modal-name" value="${name}"></div>
      <div class="form-group"><label class="form-label">Categoria</label>
        <div class="bk-select" id="m-cat">
          <div class="bk-select-trigger" id="m-cat-trigger" onclick="toggleBKSelect(event,'m-cat')"><span>${arg5 || 'Burgers'}</span></div>
          <input type="hidden" id="m-cat-hidden" value="${arg5}">
          <div class="bk-select-options shadow-lg" id="m-cat-options">
            <!-- Populado dinamicamente -->
          </div>
        </div>
      </div>
    `;
    setTimeout(() => {
        const modalCatOpts = document.getElementById('m-cat-options');
        const mainCatOpts = document.getElementById('prod-cat-reg-options');
        if (modalCatOpts && mainCatOpts) {
            modalCatOpts.innerHTML = mainCatOpts.innerHTML.replace(/prod-cat-reg/g, 'm-cat');
            const options = Array.from(modalCatOpts.querySelectorAll('.bk-select-option'));
            const currentOpt = options.find(opt => opt.getAttribute('onclick')?.includes(`'${arg5}'`));
            if (currentOpt) document.getElementById('m-cat-trigger').innerHTML = `<span>${currentOpt.innerText}</span>`;
            else document.getElementById('m-cat-trigger').innerHTML = `<span>Selecione a Categoria</span>`;
        }
    }, 20);
  } else if (type === 'User') {
    // name = nome, arg3 = email, arg4 = perfil, arg5 = unidadeId, arg6 = utilizador
    fieldsHtml = `
      <div class="form-group"><label class="form-label">Nome</label><input type="text" class="input-field" id="modal-name" value="${name}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Email</label><input type="text" class="input-field" id="modal-email" value="${arg3 || ''}"></div>
        <div class="form-group"><label class="form-label">Utilizador (Login)</label><input type="text" class="input-field" id="modal-utilizador" value="${arg6 || ''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Permissão / Perfil</label>
          <div class="bk-select" id="m-role">
            <div class="bk-select-trigger" id="m-role-trigger" onclick="toggleBKSelect(event,'m-role')">
              <span>${arg4 || 'Administrativo'}</span>
            </div>
            <input type="hidden" id="m-role-hidden" value="${arg4}">
            <div class="bk-select-options shadow-lg" id="m-role-options">
              <div class="bk-select-option" onclick="selectBKOption('Administrador', 'Administrador', '', 'm-role')">Administrador</div>
              <div class="bk-select-option" onclick="selectBKOption('Gerente', 'Gerente', '', 'm-role')">Gerente</div>
              <div class="bk-select-option" onclick="selectBKOption('Coordenador', 'Coordenador', '', 'm-role')">Coordenador</div>
              <div class="bk-select-option" onclick="selectBKOption('Diretor', 'Diretor', '', 'm-role')">Diretor</div>
              <div class="bk-select-option" onclick="selectBKOption('Administrativo', 'Administrativo', '', 'm-role')">Administrativo</div>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Nova Senha</label>
          <div class="input-wrapper" style="position:relative;">
            <input type="password" class="input-field" id="modal-pass" placeholder="********" style="padding-right:40px;">
            <button type="button" onclick="togglePasswordVisibility('modal-pass',this)" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--text-secondary);cursor:pointer;opacity:0.6;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            </button>
          </div>
        </div>
      </div>
      
      <div class="form-group"><label class="form-label">Unidade / Estabelecimento</label>
        <div class="bk-select" id="m-uni">
          <div class="bk-select-trigger" id="m-uni-trigger" onclick="toggleBKSelect(event,'m-uni')">
            <span>Carregando...</span>
          </div>
          <input type="hidden" id="m-uni-hidden" value="${arg5 || ''}">
          <div class="bk-select-options shadow-lg" id="m-uni-options" style="bottom: 100%; top: auto;">
             <!-- Populado dinamicamente -->
          </div>
        </div>
      </div>
    `;
    setTimeout(() => {
        const modalUniOpts = document.getElementById('m-uni-options');
        const mainUniOpts = document.getElementById('user-uni-reg-options');
        if (modalUniOpts && mainUniOpts) {
            modalUniOpts.innerHTML = mainUniOpts.innerHTML.replace(/user-uni-reg/g, 'm-uni');
            const options = Array.from(modalUniOpts.querySelectorAll('.bk-select-option'));
            const currentOpt = options.find(opt => opt.getAttribute('onclick')?.includes(`'${arg5}'`));
            
            if (currentOpt) {
                document.getElementById('m-uni-trigger').innerHTML = `<span>${currentOpt.innerText}</span>`;
            } else {
                document.getElementById('m-uni-trigger').innerHTML = `<span>Selecione a Unidade</span>`;
            }
        }
    }, 20);
  }

  container.innerHTML = fieldsHtml;
  checkStatus.checked = !currentItemElementId?.classList.contains('item-inactive');
  modal.classList.add('show');
}

function closeModal() {
  document.getElementById('edit-modal').classList.remove('show');
}

async function saveModalChanges() {
  if (!currentSelectedId || !currentSelectedType) return;

  const status = document.getElementById('modal-checkbox-status').checked;
  let payload = { ativo: status };
  let endpoint = '';

  if (currentSelectedType === 'User') {
    endpoint = `/users/${currentSelectedId}`;
    payload.nome = document.getElementById('modal-name').value;
    payload.email = document.getElementById('modal-email').value;
    payload.utilizador = document.getElementById('modal-utilizador').value;
    payload.cargo_funcao = document.getElementById('m-role-hidden').value;
    payload.loja_id = document.getElementById('m-uni-hidden').value;
    
    const newPass = document.getElementById('modal-pass').value;
    if (newPass && newPass.trim() !== '') payload.password = newPass;

  } else if (currentSelectedType === 'Produto') {
    endpoint = `/produtos/${currentSelectedId}`;
    payload.nome = document.getElementById('modal-name').value;
    payload.categoria_id = document.getElementById('m-cat-hidden').value;

  } else if (currentSelectedType === 'Colaborador') {
    endpoint = `/colaboradores/${currentSelectedId}`;
    payload.nome = document.getElementById('modal-name').value;
    payload.loja_id = document.getElementById('m-store-hidden').value;
    payload.cargo = document.getElementById('m-cargo-hidden').value;
    payload.turno = document.getElementById('m-shift-hidden').value;
    payload.ativo = status;
  }

  try {
    const result = await apiFetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    if (result) {
      showToast(`${currentSelectedType} atualizado com sucesso!`, 'success');
      
      // Recarregar a lista correta
      if (currentSelectedType === 'User') loadUsers();
      else if (currentSelectedType === 'Produto') loadProdutos();
      else if (currentSelectedType === 'Colaborador') loadColaboradores();
      
      closeModal();
    }
  } catch (err) {
    console.error('Erro ao salvar alterações:', err);
    showToast('Erro ao salvar alterações no servidor', 'error');
  }
}

// LOGICA DE PESQUISA REAL-TIME
function filterList(input) {
  const pane = input.closest('.sub-pane, .tab-pane');
  if (!pane) return;

  // Se for a aba de consumos, o filtro já é unificado via applyConsumosFilters
  if (pane.id === 'tab-consumos') {
    applyConsumosFilters();
    return;
  }

  applyUnifiedFilters(pane.id);
}

function applyUnifiedFilters(paneId) {
  const pane = document.getElementById(paneId);
  if (!pane) return;

  const searchInput = pane.querySelector('.search-expand input');
  const term = searchInput ? searchInput.value.toLowerCase().trim() : '';
  
  const hiddenFilter = pane.querySelector('.icon-filter + input[type="hidden"]');
  const filterVal = hiddenFilter ? hiddenFilter.value.toLowerCase().trim() : '';

  pane.querySelectorAll('.list-item').forEach(item => {
    // Pegar apenas o conteúdo visível ou específico (evitando IDs ocultos se possível)
    const itemText = item.innerText.toLowerCase();
    
    const matchesSearch = term === '' || itemText.includes(term);
    const matchesFilter = filterVal === '' || itemText.includes(filterVal);
    
    item.style.display = (matchesSearch && matchesFilter) ? '' : 'none';
  });
}

// Compatibilidade: listeners nos existentes ao carregar
document.querySelectorAll('.search-expand input').forEach(input => {
  input.addEventListener('input', () => filterList(input));
});

// LIMPAR FILTROS
function clearFilters(paneId) {
  const pane = document.getElementById(paneId);
  if (!pane) return;
  
  // Restaurar inputs de pesquisa
  pane.querySelectorAll('.search-expand input').forEach(i => { i.value = ''; });
  
  // Limpar Flatpickr if exists
  const rangePicker = pane.querySelector('#range-picker');
  if (rangePicker && rangePicker._flatpickr) {
    rangePicker._flatpickr.clear();
  }

  // Restaurar BK-Selects de filtro (empresa, categoria)
  pane.querySelectorAll('.icon-filter + input[type="hidden"]').forEach(h => {
    h.value = '';
  });

  // Mostrar todos os items (lista simples)
  if (paneId === 'tab-consumos') {
    renderConsumosTable(consumosData);
    document.getElementById('consumos-date-filter-group').style.display = 'none';
  } else {
    applyUnifiedFilters(paneId);
  }
  
  // Fechar todos os dropdowns abertos
  document.querySelectorAll('.bk-select-options').forEach(o => { o.style.display = 'none'; });
}

// LOGICA DE BUSCA (MOBILE CLICK-TO-EXPAND)
document.addEventListener('click', (e) => {
  if (window.innerWidth > 768) return;
  
  const searchContainer = e.target.closest('.search-expand');
  if (searchContainer) {
    // Se clicou na lupa, expande
    searchContainer.classList.add('is-active');
    const input = searchContainer.querySelector('input');
    if (input) input.focus();
  } else {
    // Se clicou fora, fecha todas as buscas ativas
    document.querySelectorAll('.search-expand.is-active').forEach(s => {
      s.classList.remove('is-active');
    });
  }
});


function selectBKOption(val, text, iconId, containerId, isFilter = false) {
  const container = document.getElementById(containerId);
  const hiddenInput = document.getElementById(`${containerId}-hidden`);
  if (hiddenInput) hiddenInput.value = val;

  const trigger = document.getElementById(`${containerId}-trigger`);
  const triggerInput = document.getElementById(`${containerId}-input`);

  if (!isFilter) {
    if (triggerInput) {
      triggerInput.value = text;
      triggerInput.dataset.text = text;
      triggerInput.setAttribute('readonly', 'true');
    } else if (trigger) {
      // Para registo: Mostrar Ícone + Texto original
      let iconSvg = '';
      if (val === 'manha') iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line></svg>';
      if (val === 'tarde') iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 18a5 5 0 0 0-10 0"></path><line x1="12" y1="2" x2="12" y2="9"></line></svg>';
      if (val === 'noite') iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
      
      if (iconSvg) {
        trigger.innerHTML = `${iconSvg} <span>${text}</span>`;
      } else {
        trigger.innerHTML = `<span>${text}</span>`;
      }
    }
  }

  if (isFilter) {
    const pane = container.closest('.sub-pane, .tab-pane');
    if (pane) applyUnifiedFilters(pane.id);
  }

  const options = document.getElementById(`${containerId}-options`);
  if (options) options.style.display = 'none';
}

// Close Dropdowns on outside click
window.addEventListener('click', (e) => {
  // Clique fora do menu BK principal (Logo)
  const dropdown = document.getElementById('bk-dropdown');
  if (dropdown && !e.target.closest('.logo-bk')) {
    dropdown.classList.remove('show');
  }
  
  // Fechar selects e resetar triggers com input
  if (!e.target.closest('.bk-select')) {
    document.querySelectorAll('.bk-select-options').forEach(opt => opt.style.display = 'none');
    document.querySelectorAll('.bk-select-trigger input[type="text"]').forEach(input => {
      input.setAttribute('readonly', 'true');
      const containerId = input.id.replace('-input', '');
      const hidden = document.getElementById(`${containerId}-hidden`);
      input.value = hidden && hidden.value ? (input.dataset.text || '') : '';
    });
  }

  // Clique fora do Modal (Overlay)
  const modal = document.getElementById('edit-modal');
  if (e.target === modal) {
    closeModal();
  }
});

// ===== CONSUMO REGISTRATION =====
let products = [];

function addProduct() {
  const hidden = document.getElementById('prod-reg-sel-hidden');
  if (!hidden || !hidden.value) {
    showToast('Selecione um produto', 'error');
    return;
  }
  
  const selectedItem = productsData.find(p => p.id == hidden.value);
  if (!selectedItem) return;
  
  const existing = products.find(p => p.id == selectedItem.id);
  if (existing) {
    existing.quantity++;
  } else {
    products.push({ id: selectedItem.id, label: selectedItem.nome, quantity: 1 });
  }
  
  // Limpa o seletor para permitir próxima leitura rápida
  hidden.value = '';
  const input = document.getElementById('prod-reg-sel-input');
  if (input) {
      input.value = '';
      input.dataset.text = '';
  }
  
  renderProducts();
}

function renderProducts() {
  const list = document.getElementById('product-list');
  list.innerHTML = '';
  if (products.length === 0) {
    list.innerHTML = '<div class="product-empty">Nenhum produto adicionado</div>';
    return;
  }
  products.forEach((p, i) => {
    const item = document.createElement('div');
    item.className = 'product-tag';
    item.innerHTML = `
      <div class="product-tag-info">
        <span class="product-tag-num">${p.quantity}</span>
        <span class="product-tag-name">${p.label}</span>
      </div>
      <button class="btn-remove" onclick="removeProduct(${i})">✕</button>
    `;
    list.appendChild(item);
  });
}

function removeProduct(i) {
  products.splice(i, 1);
  renderProducts();
}

async function handleSubmit() {
  const turno = document.getElementById('shift-reg-hidden').value;
  const funcId = document.getElementById('func-reg-hidden').value;
  const observacao = document.getElementById('obs-reg').value;

  if (!turno || !funcId) {
    showToast('Selecione o turno e o colaborador', 'error');
    return;
  }
  if (products.length === 0) {
    showToast('Adicione pelo menos um produto', 'error');
    return;
  }

  const payload = {
    colaborador_id: funcId,
    turno: turno,
    data_consumo: null, // O servidor usará a data atual
    observacao: observacao || '',
    itens: products.map(p => ({
      produto_id: p.id,
      quantidade: p.quantity
    }))
  };

  const result = await apiFetch('/consumos', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (result) {
    showToast('Consumo registado com sucesso!', 'success');
    products = [];
    
    // Reset fields
    const shiftHidden = document.getElementById('shift-reg-hidden');
    if(shiftHidden) shiftHidden.value = '';
    const shiftTrigger = document.getElementById('shift-reg-trigger');
    if(shiftTrigger) shiftTrigger.innerHTML = '<span>— Turno —</span>';

    const funcHidden = document.getElementById('func-reg-hidden');
    if(funcHidden) funcHidden.value = '';
    const funcInput = document.getElementById('func-reg-input');
    if(funcInput) {
       funcInput.value = '';
       funcInput.dataset.text = '';
    }
    
    document.getElementById('obs-reg').value = '';
    renderProducts();
    loadConsumos(); // Atualizar histórico
  }
}

function toggleItemStatus(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.toggle('item-inactive');
    showToast('Estado do colaborador alterado', 'success');
  }
}

async function handleSimpleSubmit(mod) {
  if (mod === 'User') {
    const nome = document.getElementById('user-nome').value;
    const utilizador = document.getElementById('user-utilizador').value;
    const email = document.getElementById('user-email').value;
    const password = document.getElementById('user-senha').value;
    const cargo_funcao = document.getElementById('user-role-reg-hidden').value;
    const loja_id = document.getElementById('user-uni-reg-hidden').value;

    if (!nome || !utilizador || !password || !loja_id || !cargo_funcao) {
      showToast('Por favor, preencha todos os campos obrigatórios', 'error');
      return;
    }

    const payload = { utilizador, nome, email, password, loja_id, cargo_funcao };
    const result = await apiFetch('/users', { method: 'POST', body: JSON.stringify(payload) });
    if (result) {
      showToast('Utilizador criado com sucesso!', 'success');
      loadUsers();
      // Limpar campos
      document.getElementById('user-nome').value = '';
      document.getElementById('user-utilizador').value = '';
      document.getElementById('user-email').value = '';
      document.getElementById('user-senha').value = '';
      
      const roleH = document.getElementById('user-role-reg-hidden');
      if (roleH) roleH.value = '';
      const roleT = document.getElementById('user-role-reg-trigger');
      if (roleT) roleT.innerHTML = '<span>— Perfil —</span>';
      
      const uniH = document.getElementById('user-uni-reg-hidden');
      if (uniH) uniH.value = '';
      const uniT = document.getElementById('user-uni-reg-trigger');
      if (uniT) uniT.innerHTML = '<span>— Selecione —</span>';

      loadLojas();
    }
    return;
  }
  
  if (mod === 'Produto') {
     const nome = document.getElementById('prod-nome').value;
     const categoria_id = document.getElementById('prod-cat-reg-hidden').value;
     if (!nome || !categoria_id) return showToast('Preencha o nome e categoria', 'error');
     
     const result = await apiFetch('/produtos', { method: 'POST', body: JSON.stringify({nome, categoria_id}) });
     if (result) {
       showToast('Produto registado com sucesso!', 'success');
       loadProdutos();
       document.getElementById('prod-nome').value = '';
       
       const catH = document.getElementById('prod-cat-reg-hidden');
       if (catH) catH.value = '';
       const catT = document.getElementById('prod-cat-reg-trigger');
       if (catT) catT.innerHTML = '<span>— Selecione —</span>';
     }
     return;
  }

  if (mod === 'Colaborador') {
     const nome = document.getElementById('colab-nome').value;
     const loja_id = document.getElementById('loja-colab-hidden').value;
     const cargo = document.getElementById('cargo-colab-hidden').value;
     const turno = document.getElementById('shift-colab-hidden').value;
     
     if (!nome || !loja_id || !turno) return showToast('Preencha nome, unidade e turno', 'error');
 
     const result = await apiFetch('/colaboradores', { 
       method: 'POST', 
       body: JSON.stringify({nome, loja_id, cargo, turno}) 
     });
     if (result) {
       showToast('Colaborador registrado com sucesso!', 'success');
       loadColaboradores();
       document.getElementById('colab-nome').value = '';
       
       const cargoH = document.getElementById('cargo-colab-hidden');
       if (cargoH) cargoH.value = '';
       const cargoT = document.getElementById('cargo-colab-trigger');
       if (cargoT) cargoT.innerHTML = '<span>— Cargo —</span>';
       
       const shiftH = document.getElementById('shift-colab-hidden');
       if (shiftH) shiftH.value = '';
       const shiftT = document.getElementById('shift-colab-trigger');
       if (shiftT) shiftT.innerHTML = '<span>— Turno —</span>';
       
       const lojaH = document.getElementById('loja-colab-hidden');
       if (lojaH) lojaH.value = '';
       const lojaT = document.getElementById('loja-colab-trigger');
       if (lojaT) lojaT.innerHTML = '<span>— Unidade —</span>';

       loadLojas();
     }
     return;
  }
}

// ===== INICIALIZAÇÃO DO RANGE PICKER (FLATPICKR) =====
// ===== DATA LOADING =====
let colaboradoresData = [];
let productsData = [];
let consumosData = [];

async function loadInitialData() {
  console.log('[DEBUG] Inicializando dados do Dashboard (Unificado)...');
  checkAuth();
  
  const user = JSON.parse(localStorage.getItem('bk_user') || '{}');
  const isAdminOrDirector = user.role === 'Administrador' || user.role === 'Diretor';

  const loaders = [
    loadColaboradores(),
    loadProdutos(),
    loadConsumos(),
    loadCategorias(),
    loadLojas()
  ];

  if (isAdminOrDirector) {
    loaders.push(loadUsers());
  }

  await Promise.all(loaders);
  console.log('[DEBUG] Carregamento inicial concluído.');
}

async function loadColaboradores() {
  console.log('[DEBUG] Carregando colaboradores...');
  const data = await apiFetch('/colaboradores');
  if (data) {
    console.log(`[DEBUG] ${data.length} colaboradores carregados.`);
    colaboradoresData = data;
    // Popular filtros e listagens
    const list = document.querySelector('#colab-filtro .mock-list');
    if (list) {
      list.innerHTML = data.map(c => {
        let turnoLabel = 'Manhã';
        let turnoColor = '#D97706'; // Amber
        let turnoBg = '#FFF4E5';    // Amber Light
        
        if (c.turno === 'tarde') {
          turnoLabel = 'Tarde';
          turnoColor = '#0284C7'; // Blue
          turnoBg = '#E0F2FE';    // Blue Light
          turnoIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px; height:12px;"><path d="M12 2v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M20 12h2"/><path d="M19.07 4.93l-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a5 5 0 0 1 0 10Z"/></svg>';
        } else if (c.turno === 'noite') {
          turnoLabel = 'Noite';
          turnoColor = '#7C3AED'; // Purple
          turnoBg = '#F3E8FF';    // Purple Light
          turnoIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px; height:12px;"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
        } else {
          // Manhã (Padrão)
          turnoIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px; height:12px;"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/></svg>';
        }

        return `
          <div class="list-item ${c.ativo ? '' : 'item-inactive'}" id="colab-${c.id}" onclick="openEditModal('Colaborador', '${c.id}', '${c.nome}', '${c.loja_id}', '${c.turno}', '${c.cargo}')">
            <div class="colab-info" style="display:flex; align-items:center; justify-content:space-between; width:100%; gap:12px;">
              <div style="flex:1;">
                <div style="font-weight:700; color:var(--bk-brown); font-size:1rem;">${c.nome}</div>
                <div style="font-size:0.75rem; color:var(--text-secondary); font-weight:600; margin-top:2px;">${c.cargo || 'Operador'}</div>
                <div style="display:flex; align-items:center; gap:4px; font-size:0.7rem; color:var(--bk-red); margin-top:4px; font-weight:700; text-transform:uppercase;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px; height:12px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  ${c.loja_nome}
                </div>
              </div>
              <div style="background:${turnoBg}; color:${turnoColor}; padding:6px 12px; border-radius:12px; font-size:0.7rem; font-weight:800; text-transform:uppercase; letter-spacing:0.04em; box-shadow: 0 2px 6px -1px rgba(0,0,0,0.05); min-width:85px; text-align:center; display:flex; align-items:center; justify-content:center; gap:6px;">
                ${turnoIcon}
                ${turnoLabel}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
    // Popular select de registro
    const selectOptions = document.getElementById('func-reg-options');
    if (selectOptions) {
      selectOptions.innerHTML = data.map(c => `
        <div class="bk-select-option" onclick="selectBKOption('${c.id}', '${c.nome}', '', 'func-reg')">${c.nome}</div>
      `).join('');
    }
  }
}

async function loadProdutos() {
  console.log('[DEBUG] Carregando produtos...');
  const data = await apiFetch('/produtos');
  if (data) {
    console.log(`[DEBUG] ${data.length} produtos carregados.`);
    productsData = data;
    const list = document.querySelector('#prod-filtro .mock-list');
    if (list) {
      list.innerHTML = data.map(p => {
        let catLabel = p.categoria_nome || 'Outros';
        let catColor = '#502314'; // Brown (Default)
        let catBg = '#F5EBDC';    // Cream
        let catIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px; height:12px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';

        const catLower = catLabel.toLowerCase();
        if (catLower.includes('burger')) {
            catColor = '#D62300'; // Red
            catBg = '#FFE8E5';
            catIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px; height:12px;"><path d="M2.5 13h19M4 17h16a2 2 0 002-2V9a2.5 2.5 0 00-2.5-2.5h-15A2.5 2.5 0 002 9v6a2 2 0 002 2z"></path></svg>';
        } else if (catLower.includes('bebida')) {
            catColor = '#0284C7'; // Blue
            catBg = '#E0F2FE';
            catIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px; height:12px;"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"></path></svg>'; 
        } else if (catLower.includes('sobremesa')) {
            catColor = '#7C3AED'; // Purple
            catBg = '#F3E8FF';
            catIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px; height:12px;"><path d="M12 2L2 22h20L12 2z"></path></svg>';
        } else if (catLower.includes('acompanhamento') || catLower.includes('batata')) {
            catColor = '#D97706'; // Amber/Orange
            catBg = '#FFF4E5';
            catIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px; height:12px;"><rect x="2" y="10" width="20" height="12" rx="2"></rect><path d="M6 10V2M10 10V4M14 10V4M18 10V2"></path></svg>'; 
        }

        return `
        <div class="list-item ${p.ativo ? '' : 'item-inactive'}" onclick="openEditModal('Produto', '${p.id}', '${p.nome}', '', '', '${p.categoria_id}')">
            <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
                <div style="display:flex; flex-direction:column; gap:2px;">
                  <strong style="color:var(--bk-brown); font-size:0.9rem;">${p.nome}</strong>
                </div>
                <div style="background:${catBg}; color:${catColor}; padding:5px 10px; border-radius:12px; font-size:0.65rem; font-weight:800; text-transform:uppercase; letter-spacing:0.04em; display:flex; align-items:center; gap:6px;">
                    ${catIcon}
                    ${catLabel}
                </div>
            </div>
        </div>
        `;
      }).join('');
    }
    // Popular select de registro por grupos
    const selectOptions = document.getElementById('prod-reg-sel-options');
    if (selectOptions) {
      const groups = {};
      data.forEach(p => {
        if (!groups[p.categoria_nome]) groups[p.categoria_nome] = [];
        groups[p.categoria_nome].push(p);
      });
      
      let html = '';
      for (const cat in groups) {
        html += `<div class="bk-group-label">${cat}</div>`;
        html += groups[cat].map(p => `
          <div class="bk-select-option" onclick="selectBKOption('${p.id}', '${p.nome}', '', 'prod-reg-sel')">${p.nome}</div>
        `).join('');
      }
      selectOptions.innerHTML = html;
    }
  }
}

async function loadConsumos() {
  console.log('[DEBUG] Buscando histórico de consumos...');
  const data = await apiFetch('/consumos');
  if (data) {
    consumosData = data;
    renderConsumosTable(consumosData);
  }
}

function renderConsumosTable(data) {
  const grid = document.getElementById('consumos-grid');
  const emptyMsg = document.getElementById('consumos-empty');

  if (!grid) return;

  if (!data || data.length === 0) {
    grid.innerHTML = '';
    emptyMsg.style.display = 'block';
    return;
  }

  emptyMsg.style.display = 'none';
  grid.parentElement.style.display = 'block';

  grid.innerHTML = data.map(c => {
    // Usar data_registro como prioridade para garantir precisão exata da Hora.
    const d = new Date(c.data_registro || c.data_consumo);
    const dataFmt = d.toLocaleDateString();
    const horaFmt = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Icone do Turso dinâmico
    let turnoIcon = '';
    const t = c.turno.toLowerCase();
    if (t === 'manhã' || t === 'manha') {
      turnoIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px; height:12px; display:inline-block; vertical-align:text-bottom; margin-right:3px;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line></svg>`;
    } else if (t === 'tarde') {
      turnoIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px; height:12px; display:inline-block; vertical-align:text-bottom; margin-right:3px;"><path d="M17 18a5 5 0 0 0-10 0"></path><line x1="12" y1="2" x2="12" y2="9"></line></svg>`;
    } else if (t === 'noite') {
      turnoIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px; height:12px; display:inline-block; vertical-align:text-bottom; margin-right:3px;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    }

    const safeConsumoStr = encodeURIComponent(JSON.stringify(c));

    return `
      <div 
        class="consumo-card" 
        style="background: #fff; border: 1.5px solid var(--border-subtle); border-radius: 12px; padding: 14px 18px; cursor: pointer; transition: all 0.2s ease; display:flex; justify-content:space-between; align-items:center; box-shadow: 0 4px 10px rgba(80,35,20,0.02);"
        onmouseover="this.style.boxShadow='0 8px 20px rgba(80,35,20,0.08)'; this.style.transform='translateY(-2px)'; this.style.borderColor='var(--bk-brown)';"
        onmouseout="this.style.boxShadow='0 4px 10px rgba(80,35,20,0.02)'; this.style.transform='translateY(0)'; this.style.borderColor='var(--border-subtle)';"
        onclick="openConsumoDetailModal('${safeConsumoStr}')"
      >
        <div style="display:flex; flex-direction:column; gap:4px;">
           <span style="font-weight: 800; color: var(--bk-brown); font-size: 1rem;">${c.colaborador_nome}</span>
           <span style="font-size: 0.75rem; color: #888; font-weight:600; display:flex; align-items:center; gap:4px;">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 12px; height: 12px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
             ${dataFmt} às ${horaFmt}
           </span>
        </div>
        <div style="display:flex; align-items:center;">
          <span class="consumo-badge badge-${t}" style="padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase;">
            ${turnoIcon}${c.turno}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

// === MODAL DE DETALHES DE CONSUMO ===
function openConsumoDetailModal(safeJsonStr) {
  try {
    const c = JSON.parse(decodeURIComponent(safeJsonStr));
    const d = new Date(c.data_registro || c.data_consumo);
    const dataFmt = d.toLocaleDateString();
    const horaFmt = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let turnoIcon = '';
    const t = c.turno.toLowerCase();
    if (t === 'manhã' || t === 'manha') {
      turnoIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px; height:11px; display:inline-block; vertical-align:text-bottom; margin-right:2px;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line></svg>`;
    } else if (t === 'tarde') {
      turnoIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px; height:11px; display:inline-block; vertical-align:text-bottom; margin-right:2px;"><path d="M17 18a5 5 0 0 0-10 0"></path><line x1="12" y1="2" x2="12" y2="9"></line></svg>`;
    } else if (t === 'noite') {
      turnoIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px; height:11px; display:inline-block; vertical-align:text-bottom; margin-right:2px;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    }

    const agrupados = {};
    c.itens.forEach(i => {
      if(agrupados[i.nome]) {
        agrupados[i.nome] += parseInt(i.quantidade || 1, 10);
      } else {
        agrupados[i.nome] = parseInt(i.quantidade || 1, 10);
      }
    });

    const itensHtml = Object.keys(agrupados).map(nome => `
      <div style="display: flex; align-items:center; border-bottom: 1px dashed #eee; padding: 8px 0; gap: 8px;">
        <span style="background: var(--bk-red); color: white; border-radius: 20px; padding: 2px 8px; font-size: 0.75rem; font-weight:800;">${agrupados[nome]}x</span>
        <span style="color: var(--bk-brown); font-weight: 700; font-size:0.85rem; flex:1;">${nome}</span>
      </div>
    `).join('');

    const totais = Object.keys(agrupados).length;

    document.getElementById('consumo-detail-body').innerHTML = `
      <div style="margin-bottom: 16px; text-align:center; background:var(--body-bg); padding:10px; border-radius:10px;">
        <div style="font-size: 0.65rem; color: #888; text-transform: uppercase; font-weight: 800; margin-bottom: 2px;">Colaborador</div>
        <div style="font-size: 1rem; font-weight: 800; color: var(--bk-brown);">${c.colaborador_nome}</div>
        <div style="font-size: 0.7rem; color: #666; margin-top:2px;">Lançado por: ${c.usuario_nome}</div>
      </div>
      
      <div style="display: flex; gap: 8px; margin-bottom: 16px;">
        <div style="flex: 1; border: 1.5px solid var(--border-subtle); padding: 8px 6px; border-radius: 8px; text-align: center; display:flex; flex-direction:column; justify-content:center;">
          <div style="font-size: 0.6rem; color: #888; font-weight: 800; text-transform: uppercase; margin-bottom: 2px;">Data / Hora</div>
          <div style="font-weight: 800; color: var(--text-primary); font-size: 0.7rem;">
            ${dataFmt} <span style="color:var(--primary-color); margin-left:4px;">${horaFmt}</span>
          </div>
        </div>
        <div style="flex: 1; border: 1.5px solid var(--border-subtle); padding: 8px 6px; border-radius: 8px; text-align: center; display:flex; flex-direction:column; justify-content:center;">
          <div style="font-size: 0.6rem; color: #888; font-weight: 800; text-transform: uppercase; margin-bottom: 2px;">Turno</div>
          <div><span class="consumo-badge badge-${t}" style="font-size:0.65rem; padding:2px 6px; white-space:nowrap;">${turnoIcon}${c.turno}</span></div>
        </div>
      </div>

      <div style="margin-bottom: 16px;">
        <div style="font-size: 0.7rem; color: #888; text-transform: uppercase; font-weight: 800; margin-bottom: 4px;">Produtos (${totais})</div>
        <div style="border: 1.5px solid var(--border-subtle); border-radius: 8px; padding: 0 10px; background:#fff; max-height: 160px; overflow-y: auto;">
          ${itensHtml}
        </div>
      </div>

      ${c.observacao ? `
      <div>
        <div style="font-size: 0.7rem; color: #888; text-transform: uppercase; font-weight: 800; margin-bottom: 4px;">Observação</div>
        <div style="background: #FFF4E5; color: #D97706; padding: 10px; border-radius: 8px; font-style: italic; font-weight: 600; font-size: 0.8rem; border-left:4px solid #D97706; line-height:1.4;">
          "${c.observacao}"
        </div>
      </div>
      ` : ''}
    `;
    
    document.getElementById('consumo-detail-modal').style.display = 'flex';
  } catch (err) {
    console.error('Failed to parse consumo details', err);
  }
}

function closeConsumoDetailModal() {
  const m = document.getElementById('consumo-detail-modal');
  if(m) m.style.display = 'none';
}


function applyConsumosFilters() {
  const searchText = document.querySelector('#tab-consumos input[placeholder*="funcionário"]').value.toLowerCase();
  const rangeInput = document.getElementById('range-picker').value;
  
  let filtered = consumosData;

  // Filtro de texto
  if (searchText) {
    filtered = filtered.filter(c => 
      c.colaborador_nome.toLowerCase().includes(searchText) || 
      c.colaborador_id.toString().includes(searchText) ||
      c.id.toString().includes(searchText)
    );
  }

  // Filtro de data
  if (rangeInput && rangeInput.includes(' até ')) {
    const [startStr, endStr] = rangeInput.split(' até ');
    const [d1, m1, y1] = startStr.split('/').map(Number);
    const [d2, m2, y2] = endStr.split('/').map(Number);
    
    const startDate = new Date(y1, m1 - 1, d1, 0, 0, 0);
    const endDate = new Date(y2, m2 - 1, d2, 23, 59, 59);

    filtered = filtered.filter(c => {
      const consumptionDate = new Date(c.data_consumo);
      return consumptionDate >= startDate && consumptionDate <= endDate;
    });
  }

  renderConsumosTable(filtered);
}

async function loadCategorias() {
  const data = await apiFetch('/categorias');
  if (data) {
    const select = document.getElementById('prod-cat-reg-options');
    if (select) {
      select.innerHTML = data.map(c => `
        <div class="bk-select-option" onclick="selectBKOption('${c.id}', '${c.nome}', '', 'prod-cat-reg')">${c.nome}</div>
      `).join('');
    }
  }
}

async function loadLojas() {
  console.log('[DEBUG] Carregando unidades unificadas...');
  const data = await apiFetch('/lojas');
  if (data) {
    const user = JSON.parse(localStorage.getItem('bk_user') || '{}');

    // 1. Popular select de cadastro de colaborador
    const selectOptionsColab = document.getElementById('loja-colab-options');
    if (selectOptionsColab) {
      selectOptionsColab.innerHTML = data.map(l => `
        <div class="bk-select-option" onclick="selectBKOption('${l.id}', '${l.nome}', '', 'loja-colab')">${l.nome}</div>
      `).join('');

      // Pré-selecionar unidade do usuário logado
      if (user.loja_id) {
        const myLoja = data.find(l => l.id == user.loja_id);
        if (myLoja) selectBKOption(myLoja.id, myLoja.nome, '', 'loja-colab');
      }
    }

    // 2. Popular select de cadastro de usuários
    const selectOptionsUser = document.getElementById('user-uni-reg-options');
    if (selectOptionsUser) {
      selectOptionsUser.innerHTML = data.map(l => `
        <div class="bk-select-option" onclick="selectBKOption('${l.id}', '${l.nome}', '', 'user-uni-reg')">${l.nome}</div>
      `).join('');

      // Pré-selecionar unidade do usuário logado
      if (user.loja_id) {
        const myLoja = data.find(l => l.id == user.loja_id);
        if (myLoja) selectBKOption(myLoja.id, myLoja.nome, '', 'user-uni-reg');
      }
    }

    // 3. Popular filtro de usuários
    const selectOptionsFilter = document.getElementById('uni-filter-options');
    if (selectOptionsFilter) {
      selectOptionsFilter.innerHTML = data.map(l => `
        <div class="bk-select-option" onclick="selectBKOption('${l.nome}', '${l.nome}', '', 'uni-filter', true)">${l.nome}</div>
      `).join('');
    }
  }
}

async function loadUsers() {
  const user = JSON.parse(localStorage.getItem('bk_user') || '{}');
  if (user.role !== 'Administrador' && user.role !== 'Diretor') {
    console.warn('[AUTH] Acesso a utilizadores ignorado por falta de permissão.');
    return;
  }

  const data = await apiFetch('/users');
  if (data) {
    const list = document.querySelector('#user-filtro .mock-list');
    if (list) {
      list.innerHTML = data.map(u => {
        // Badge colorido por cargo/perfil
        const cargo = u.cargo_funcao || 'Operador';
        const cargoLower = cargo.toLowerCase();
        let roleColor = '#D97706';
        let roleBg    = '#FFF4E5';
        let roleIcon  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px;height:12px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

        if (cargoLower.includes('admin')) {
          roleColor = '#D62300'; roleBg = '#FFE8E5';
          roleIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px;height:12px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
        } else if (cargoLower.includes('diretor')) {
          roleColor = '#7C3AED'; roleBg = '#F3E8FF';
          roleIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px;height:12px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
        } else if (cargoLower.includes('gerente')) {
          roleColor = '#0284C7'; roleBg = '#E0F2FE';
          roleIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px;height:12px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
        }

        return `
          <div class="list-item ${u.ativo ? '' : 'item-inactive'}" onclick="openEditModal('User', '${u.id}', '${u.nome}', '${u.email}', '${u.cargo_funcao}', '${u.loja_id}', '${u.utilizador}')">
            <div style="display:flex; align-items:center; justify-content:space-between; width:100%; gap:12px;">
              <div style="flex:1; min-width:0;">
                <div style="font-weight:700; color:var(--bk-brown); font-size:1rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${u.nome}</div>
                <div style="font-size:0.75rem; color:var(--text-secondary); font-weight:500; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">@${u.utilizador}</div>
                <div style="font-size:0.7rem; color:#999; margin-top:2px;">${u.email}</div>
              </div>
              <div style="background:${roleBg}; color:${roleColor}; padding:6px 12px; border-radius:12px; font-size:0.7rem; font-weight:800; text-transform:uppercase; letter-spacing:0.04em; box-shadow: 0 2px 6px -1px rgba(0,0,0,0.05); white-space:nowrap; display:flex; align-items:center; gap:6px; flex-shrink:0;">
                ${roleIcon}
                ${cargo}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

// ===== EXCLUSÃO DE REGISTRO =====
async function handleDeleteItem() {
  if (!currentSelectedId || !currentSelectedType) return;

  const confirmed = await showConfirm(`Tem certeza que deseja excluir este ${currentSelectedType.toLowerCase()}?\nEsta ação não poderá ser desfeita.`);
  if (!confirmed) return;

  let endpoint = '';
  if (currentSelectedType === 'Colaborador') endpoint = `/colaboradores/${currentSelectedId}`;
  else if (currentSelectedType === 'Produto') endpoint = `/produtos/${currentSelectedId}`;
  else if (currentSelectedType === 'User') endpoint = `/users/${currentSelectedId}`;

  try {
    const result = await apiFetch(endpoint, { method: 'DELETE' });
    if (result) {
      showToast(`${currentSelectedType} removido com sucesso!`, 'success');
      closeModal();
      
      // Recarregar os dados da aba correspondente
      if (currentSelectedType === 'Colaborador') loadColaboradores();
      else if (currentSelectedType === 'Produto') loadProdutos();
      else if (currentSelectedType === 'User') loadUsers();
    }
  } catch (err) {
    console.error('[ERROR] Falha ao deletar:', err);
    showToast('Erro ao excluir registro', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadInitialData();
  
  if (typeof flatpickr !== 'undefined') {
    flatpickr("#range-picker", {
      mode: "range",
      dateFormat: "d/m/Y",
      separator: " até ",
      locale: "pt",
      disableMobile: "true",
      onOpen: function() {
        showToast('Selecione o intervalo de datas', 'info');
      },
      onChange: function(selectedDates) {
        if (selectedDates.length === 2) {
          applyConsumosFilters();
        }
      }
    });
  }
});
function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px; height:18px;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
  } else {
    input.type = 'password';
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px; height:18px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  }
}
