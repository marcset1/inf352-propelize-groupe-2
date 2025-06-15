const API_URL = 'http://localhost:8081/front';
let accessToken = '';
let refreshToken = '';
let currentUser = null;
let navigationStack = [];

// Navigation Management
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(pageId).classList.add('active');
  
  if (pageId === 'auth-page') {
    document.getElementById('nav-header').classList.add('hidden');
  } else {
    document.getElementById('nav-header').classList.remove('hidden');
  }
}

function navigateTo(pageId) {
  navigationStack.push(getCurrentPage());
  showPage(pageId);
}

function getCurrentPage() {
  const activePage = document.querySelector('.page.active');
  return activePage ? activePage.id : 'auth-page';
}

function goBack() {
  if (navigationStack.length > 0) {
    const previousPage = navigationStack.pop();
    showPage(previousPage);
  } else {
    showPage('dashboard-page');
  }
}

// Message Management
function showMessage(message, type = 'info') {
  const container = document.getElementById('message-container');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = message;
  container.innerHTML = '';
  container.appendChild(messageDiv);
  
  setTimeout(() => {
    messageDiv.remove();
  }, 5000);
}

function showError(message) {
  showMessage(message, 'error');
}

function showSuccess(message) {
  showMessage(message, 'success');
}

// Authentication Functions
function showLogin() {
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('register-form').style.display = 'none';
}

function showRegister() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
}

async function login() {
  const name = document.getElementById('login-name').value.trim();
  const password = document.getElementById('login-password').value.trim();
  
  if (!name || !password) {
    showError('Username and password are required');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      accessToken = data.accessToken;
      refreshToken = data.refreshToken;
      currentUser = data.user;
      document.getElementById('username-display').textContent = `Welcome, ${currentUser.name}`;
      navigationStack = [];
      showPage('dashboard-page');
      showSuccess('Login successful');
    } else {
      showError(data.error || 'Login failed');
    }
  } catch (error) {
    showError('Connection failed. Please try again.');
  }
}

async function register() {
  const name = document.getElementById('register-name').value.trim();
  const password = document.getElementById('register-password').value.trim();
  
  if (!name || !password) {
    showError('Username and password are required');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      accessToken = data.accessToken;
      refreshToken = data.refreshToken;
      currentUser = data.user;
      document.getElementById('username-display').textContent = `Welcome, ${currentUser.name}`;
      navigationStack = [];
      showPage('dashboard-page');
      showSuccess('Account created successfully');
    } else {
      showError(data.error || 'Registration failed');
    }
  } catch (error) {
    showError('Connection failed. Please try again.');
  }
}

async function refreshAccessToken() {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      accessToken = data.accessToken;
      refreshToken = data.refreshToken;
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function logout() {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
  } catch (error) {}
  
  accessToken = '';
  refreshToken = '';
  currentUser = null;
  navigationStack = [];
  showPage('auth-page');
  showSuccess('Logged out successfully');
}

// Navigation Functions
function showVehicleOptions() {
  navigateTo('vehicle-options-page');
}

function showUserOptions() {
  navigateTo('user-options-page');
  loadUserOperation(currentUser.role === 'admin' ? 'list' : 'view-profile');
}

function showUserOperation(operation) {
  navigateTo('user-operations-page');
  loadUserOperation(operation);
}

function showVehicleOperation(operation) {
  navigateTo('vehicle-operations-page');
  loadVehicleOperation(operation);
}

// Vehicle Operations
function loadVehicleOperation(operation) {
  const content = document.getElementById('vehicle-content');
  
  switch(operation) {
    case 'create':
      content.innerHTML = getVehicleCreateForm();
      break;
    case 'list':
      content.innerHTML = getVehicleListView();
      fetchVehicles();
      break;
    case 'search':
      content.innerHTML = getVehicleSearchForm();
      break;
    case 'filter':
      content.innerHTML = getVehicleFilterForm();
      break;
  }
}

function getVehicleCreateForm() {
  return `
    <h2 class="card-subtitle">Add New Vehicle</h2>
    <div class="form-group">
      <label class="form-label" for="vehicle-marque">Brand</label>
      <input type="text" id="vehicle-marque" class="form-input" placeholder="Enter vehicle brand">
    </div>
    <div class="form-group">
      <label class="form-label" for="vehicle-model">Model</label>
      <input type="text" id="vehicle-model" class="form-input" placeholder="Enter vehicle model">
    </div>
    <div class="form-group">
      <label class="form-label" for="vehicle-immatriculation">License Plate</label>
      <input type="text" id="vehicle-immatriculation" class="form-input" placeholder="Enter license plate">
    </div>
    <div class="form-group">
      <label class="form-label" for="vehicle-annees">Year</label>
      <input type="number" id="vehicle-annees" class="form-input" placeholder="Enter year" min="1900" max="2030">
    </div>
    <div class="form-group">
      <label class="form-label" for="vehicle-prix">Daily Rate ($)</label>
      <input type="number" id="vehicle-prix" class="form-input" placeholder="Enter daily rate" min="0" step="0.01">
    </div>
    <button class="btn" onclick="createVehicle()">Add Vehicle</button>
  `;
}

function getVehicleListView() {
  return `
    <h2 class="card-subtitle">All Vehicles</h2>
    <div id="vehicle-grid" class="vehicles-grid"></div>
  `;
}

function getVehicleSearchForm() {
  return `
    <h2 class="card-subtitle">Search Vehicle</h2>
    <div class="action-row">
      <div class="action-group">
        <label class="form-label" for="search-immatriculation">License Plate</label>
        <input type="text" id="search-immatriculation" class="form-input" 
               placeholder="Enter license plate to search">
      </div>
      <button class="action-btn" onclick="searchVehicle()">Search</button>
    </div>
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Brand</th>
            <th>Model</th>
            <th>License Plate</th>
            <th>Year</th>
            <th>Daily Rate</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="search-results"></tbody>
      </table>
    </div>
  `;
}

function getVehicleFilterForm() {
  return `
    <h2 class="card-subtitle">Filter by Price</h2>
    <div class="action-row">
      <div class="action-group">
        <label class="form-label" for="filter-price">Maximum Daily Rate ($)</label>
        <input type="number" id="filter-price" class="form-input" 
               placeholder="Enter maximum price" min="0" step="0.01">
      </div>
      <button class="action-btn" onclick="filterVehicles()">Filter</button>
    </div>
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Brand</th>
            <th>Model</th>
            <th>License Plate</th>
            <th>Year</th>
            <th>Daily Rate</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="filter-results"></tbody>
      </table>
    </div>
  `;
}

function getVehicleEditForm(vehicle) {
  return `
    <h2 class="card-subtitle">Edit Vehicle</h2>
    <div class="form-group">
      <label class="form-label" for="edit-vehicle-marque">Brand</label>
      <input type="text" id="edit-vehicle-marque" class="form-input" value="${vehicle.marque}" placeholder="Enter vehicle brand">
    </div>
    <div class="form-group">
      <label class="form-label" for="edit-vehicle-model">Model</label>
      <input type="text" id="edit-vehicle-model" class="form-input" value="${vehicle.model}" placeholder="Enter vehicle model">
    </div>
    <div class="form-group">
      <label class="form-label" for="edit-vehicle-immatriculation">License Plate</label>
      <input type="text" id="edit-vehicle-immatriculation" class="form-input" value="${vehicle.immatriculation}" placeholder="Enter license plate">
    </div>
    <div class="form-group">
      <label class="form-label" for="edit-vehicle-annees">Year</label>
      <input type="number" id="edit-vehicle-annees" class="form-input" value="${vehicle.annees}" placeholder="Enter year" min="1900" max="2030">
    </div>
    <div class="form-group">
      <label class="form-label" for="edit-vehicle-prix">Daily Rate ($)</label>
      <input type="number" id="edit-vehicle-prix" class="form-input" value="${vehicle.prixLocation}" placeholder="Enter daily rate" min="0" step="0.01">
    </div>
    <button class="btn" onclick="saveVehicle('${vehicle.id}')">Save Changes</button>
    <button class="btn btn-secondary" onclick="loadVehicleOperation('list')" style="margin-top: 10px;">Cancel</button>
  `;
}

// User Operations
function loadUserOperation(operation) {
    const content = document.getElementById('user-content');
    const userOptions = document.getElementById('user-options-page');
    
    if (userOptions && currentUser.role !== 'admin') {
      userOptions.innerHTML = `
        <div class="card">
          <h2 class="card-subtitle">User Management</h2>
          <div class="operations-grid">
            <div class="operation-btn" onclick="showUserOperation('view-profile')">
              👤 View Profile
            </div>
            <div class="operation-btn" onclick="showUserOperation('modify-profile')">
              ✏️ Modify Profile
            </div>
          </div>
        </div>
      `;
    } else if (userOptions) {
      userOptions.innerHTML = `
        <div class="card">
          <h2 class="card-subtitle">User Management</h2>
          <div class="operations-grid">
            <div class="operation-btn" onclick="showUserOperation('create')">
              ➕ Add User
            </div>
            <div class="operation-btn" onclick="showUserOperation('list')">
              📋 View All Users
            </div>
          </div>
        </div>
      `;
    }
  
    switch(operation) {
      case 'create':
        if (currentUser.role !== 'admin') {
          showError('Only admins can create users');
          return;
        }
        content.innerHTML = getUserCreateForm();
        break;
      case 'list':
        if (currentUser.role !== 'admin') {
          showError('Only admins can view all users');
          return;
        }
        content.innerHTML = getUserListView();
        fetchUsers();
        break;
      case 'view-profile':
        content.innerHTML = getUserProfileView();
        setTimeout(() => {
          fetchCurrentUser();
        }, 100);
        break;
      case 'modify-profile':
        content.innerHTML = getUserProfileEditForm();
        setTimeout(() => {
          fetchCurrentUserForEdit();
        }, 100);
        break;
    }
  }
  
async function fetchCurrentUser() {
  try {
    const response = await fetchWithAuth(`${API_URL}/users/me`);
    if (!response) {
      showError('Authentication failed');
      return;
    }

    if (response.ok) {
      const user = await response.json();
      const userProfile = document.getElementById('user-profile');
      
      if (userProfile) {
        userProfile.innerHTML = `
          <tr>
            <td>${user.id || 'N/A'}</td>
            <td>${user.name || 'N/A'}</td>
            <td>${user.role || 'N/A'}</td>
            <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
          </tr>
        `;
      } else {
        console.error('Element user-profile not found');
        showError('Unable to display profile');
      }
    } else {
      const errorData = await response.json();
      showError(errorData.error || 'Failed to fetch your profile');
    }
  } catch (error) {
    console.error('Fetch current user error:', error);
    showError('Failed to fetch your profile');
  }
}

function getUserCreateForm() {
  return `
    <h2 class="card-subtitle">Add New User</h2>
    <div class="form-group">
      <label class="form-label" for="user-name">Username</label>
      <input type="text" id="user-name" class="form-input" placeholder="Enter username">
    </div>
    <div class="form-group">
      <label class="form-label" for="user-password">Password</label>
      <input type="password" id="user-password" class="form-input" placeholder="Enter password">
    </div>
    <div class="form-group">
      <label class="form-label" for="user-role">Role</label>
      <select id="user-role" class="form-select">
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
    </div>
    <button class="btn" onclick="createUser()">Add User</button>
  `;
}

function getUserListView() {
  return `
    <h2 class="card-subtitle">All Users</h2>
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Role</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="user-list"></tbody>
      </table>
    </div>
  `;
}

function getUserEditForm(user) {
  return `
    <h2 class="card-subtitle">Edit User</h2>
    <div class="form-group">
      <label class="form-label" for="edit-user-name">Username</label>
      <input type="text" id="edit-user-name" class="form-input" value="${user.name}" placeholder="Enter username">
    </div>
    <div class="form-group">
      <label class="form-label" for="edit-user-password">Password</label>
      <input type="password" id="edit-user-password" class="form-input" placeholder="Enter new password (leave blank to keep current)">
    </div>
    <div class="form-group">
      <label class="form-label" for="edit-user-role">Role</label>
      <select id="edit-user-role" class="form-select">
        <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
      </select>
    </div>
    <button class="btn" onclick="saveUser('${user.id}')">Save Changes</button>
    <button class="btn btn-secondary" onclick="loadUserOperation('list')" style="margin-top: 10px;">Cancel</button>
  `;
}

function getUserProfileView() {
  return `
    <h2 class="card-subtitle">Votre Profil</h2>
    <div class="user-profile">
      <div class="user-avatar">
        <i class="fas fa-user-circle"></i>
      </div>
      <div class="user-info">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Rôle</th>
              <th>Création</th>
            </tr>
          </thead>
          <tbody id="user-profile"></tbody>
        </table>
      </div>
    </div>
    <button class="btn btn-secondary" onclick="goBack()" style="margin-top: 20px;">
      <i class="fas fa-arrow-left"></i> Retour
    </button>
  `;
}

function getUserProfileEditForm() {
    return `
      <h2 class="card-subtitle">Modify Your Profile</h2>
      <div class="form-group">
        <label class="form-label" for="edit-user-name">Username</label>
        <input type="text" id="edit-user-name" class="form-input" placeholder="Enter username">
      </div>
      <div class="form-group">
        <label class="form-label" for="edit-user-password">Password</label>
        <input type="password" id="edit-user-password" class="form-input" placeholder="Enter new password (leave blank to keep current)">
      </div>
      <button class="btn" onclick="saveCurrentUserProfile()">Save Changes</button>
      <button class="btn btn-secondary" onclick="goBack()" style="margin-top: 10px;">Cancel</button>
    `;
}

async function saveCurrentUserProfile() {
  const name = document.getElementById('edit-user-name').value.trim();
  const password = document.getElementById('edit-user-password').value.trim();
  
  if (!name) {
    showError('Username is required');
    return;
  }

  const updateData = { name };
  if (password) {
    updateData.password = password;
  }

  try {
    const response = await fetchWithAuth(`${API_URL}/users/${currentUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    if (!response) return;

    if (response.ok) {
      const updatedUser = await response.json();
      showSuccess('Profile updated successfully');
      currentUser.name = updatedUser.name;
      document.getElementById('username-display').textContent = `Welcome, ${currentUser.name}`;
      loadUserOperation('view-profile');
    } else {
      const data = await response.json();
      showError(data.error || 'Failed to update profile');
    }
  } catch (error) {
    console.error('Save profile error:', error);
    showError('Failed to update profile');
  }
}

// API Helper Functions
async function fetchWithAuth(url, options = {}) {
  options.headers = { ...options.headers, 'Authorization': `Bearer ${accessToken}` };
  let response = await fetch(url, options);
  
  if (response.status === 403) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      options.headers['Authorization'] = `Bearer ${accessToken}`;
      response = await fetch(url, options);
    } else {
      logout();
      return null;
    }
  }
  return response;
}

// Vehicle API Functions
async function createVehicle() {
  const vehicle = {
    marque: document.getElementById('vehicle-marque').value.trim(),
    model: document.getElementById('vehicle-model').value.trim(),
    immatriculation: document.getElementById('vehicle-immatriculation').value.trim(),
    annees: parseInt(document.getElementById('vehicle-annees').value),
    prixLocation: parseFloat(document.getElementById('vehicle-prix').value)
  };

  if (!vehicle.marque || !vehicle.model || !vehicle.immatriculation || !vehicle.annees || !vehicle.prixLocation) {
    showError('All fields are required');
    return;
  }

  try {
    const response = await fetchWithAuth(`${API_URL}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicle)
    });

    if (!response) return;

    const data = await response.json();
    if (response.ok) {
      showSuccess('Vehicle created successfully');
      document.getElementById('vehicle-marque').value = '';
      document.getElementById('vehicle-model').value = '';
      document.getElementById('vehicle-immatriculation').value = '';
      document.getElementById('vehicle-annees').value = '';
      document.getElementById('vehicle-prix').value = '';
      loadVehicleOperation('list');
    } else {
      showError(data.error || 'Failed to create vehicle');
    }
  } catch (error) {
    showError('Failed to create vehicle');
  }
}

async function fetchVehicles() {
  try {
    const response = await fetchWithAuth(`${API_URL}/vehicles`);
    if (!response) return;

    const vehicles = await response.json();
    const vehicleGrid = document.getElementById('vehicle-grid');
    vehicleGrid.innerHTML = '';

    vehicles.forEach(vehicle => {
      vehicleGrid.innerHTML += renderVehicleCard(vehicle);
    });
  } catch (error) {
    showError('Failed to fetch vehicles');
  }
}

async function searchVehicle() {
  const immatriculation = document.getElementById('search-immatriculation').value.trim();
  
  if (!immatriculation) {
    showError('Please enter a license plate');
    return;
  }

  try {
    const response = await fetchWithAuth(`${API_URL}/vehicles/search/${immatriculation}`);
    if (!response) return;

    const searchResults = document.getElementById('search-results');
    
    if (response.ok) {
      const vehicle = await response.json();
      searchResults.innerHTML = `
        <tr>
          <td>${vehicle.id}</td>
          <td>${vehicle.marque}</td>
          <td>${vehicle.model}</td>
          <td>${vehicle.immatriculation}</td>
          <td>${vehicle.annees}</td>
          <td>${vehicle.prixLocation}</td>
          <td>
            <button class="table-btn" onclick="editVehicle('${vehicle.id}')">Edit</button>
            <button class="table-btn danger" onclick="deleteVehicle('${vehicle.id}')">Delete</button>
          </td>
        </tr>
      `;
    } else {
      const data = await response.json();
      searchResults.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #666;">No vehicle found with that license plate</td></tr>`;
    }
  } catch (error) {
    showError('Search failed');
  }
}

async function filterVehicles() {
  const price = document.getElementById('filter-price').value;
  
  if (!price) {
    showError('Please enter a maximum price');
    return;
  }

  try {
    const response = await fetchWithAuth(`${API_URL}/vehicles/price/${price}`);
    if (!response) return;

    const vehicles = await response.json();
    const filterResults = document.getElementById('filter-results');
    filterResults.innerHTML = '';

    if (vehicles.length === 0) {
      filterResults.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #666;">No vehicles found under ${price}</td></tr>`;
      return;
    }

    vehicles.forEach(vehicle => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${vehicle.id}</td>
        <td>${vehicle.marque}</td>
        <td>${vehicle.model}</td>
        <td>${vehicle.immatriculation}</td>
        <td>${vehicle.annees}</td>
        <td>${vehicle.prixLocation}</td>
        <td>
          <button class="table-btn" onclick="editVehicle('${vehicle.id}')">Edit</button>
          <button class="table-btn danger" onclick="deleteVehicle('${vehicle.id}')">Delete</button>
        </td>
      `;
      filterResults.appendChild(row);
    });
  } catch (error) {
    showError('Filter failed');
  }
}

async function editVehicle(id) {
  try {
    const response = await fetchWithAuth(`${API_URL}/vehicles/${id}`);
    if (!response) return;

    const vehicle = await response.json();
    document.getElementById('vehicle-content').innerHTML = getVehicleEditForm(vehicle);
  } catch (error) {
    showError('Failed to load vehicle for editing');
  }
}

async function saveVehicle(id) {
  const vehicle = {
    marque: document.getElementById('edit-vehicle-marque').value.trim(),
    model: document.getElementById('edit-vehicle-model').value.trim(),
    immatriculation: document.getElementById('edit-vehicle-immatriculation').value.trim(),
    annees: parseInt(document.getElementById('edit-vehicle-annees').value),
    prixLocation: parseFloat(document.getElementById('edit-vehicle-prix').value)
  };

  if (!vehicle.marque || !vehicle.model || !vehicle.immatriculation || !vehicle.annees || !vehicle.prixLocation) {
    showError('All fields are required');
    return;
  }

  try {
    const response = await fetchWithAuth(`${API_URL}/vehicles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicle)
    });

    if (!response) return;

    if (response.ok) {
      showSuccess('Vehicle updated successfully');
      loadVehicleOperation('list');
    } else {
      const data = await response.json();
      showError(data.error || 'Failed to update vehicle');
    }
  } catch (error) {
    showError('Failed to update vehicle');
  }
}

async function deleteVehicle(id) {
  if (!confirm('Are you sure you want to delete this vehicle?')) {
    return;
  }

  try {
    const response = await fetchWithAuth(`${API_URL}/vehicles/${id}`, {
      method: 'DELETE'
    });

    if (!response) return;

    if (response.ok) {
      showSuccess('Vehicle deleted successfully');
      const currentContent = document.getElementById('vehicle-content').innerHTML;
      if (currentContent.includes('All Vehicles')) {
        fetchVehicles();
      }
    } else {
      const data = await response.json();
      showError(data.error || 'Failed to delete vehicle');
    }
  } catch (error) {
    showError('Failed to delete vehicle');
  }
}

// User API Functions
async function createUser() {
  if (currentUser.role !== 'admin') {
    showError('Only admins can create users');
    return;
  }

  const user = {
    name: document.getElementById('user-name').value.trim(),
    password: document.getElementById('user-password').value.trim(),
    role: document.getElementById('user-role').value
  };

  if (!user.name || !user.password) {
    showError('Username and password are required');
    return;
  }

  try {
    const response = await fetchWithAuth(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });

    if (!response) return;

    const data = await response.json();
    if (response.ok) {
      showSuccess('User created successfully');
      document.getElementById('user-name').value = '';
      document.getElementById('user-password').value = '';
      document.getElementById('user-role').value = 'user';
    } else {
      showError(data.error || 'Failed to create user');
    }
  } catch (error) {
    showError('Failed to create user');
  }
}

async function fetchUsers() {
  if (currentUser.role !== 'admin') {
    showError('Only admins can view users');
    document.getElementById('user-list').innerHTML = '';
    return;
  }

  try {
    const response = await fetchWithAuth(`${API_URL}/users`);
    if (!response) return;

    const users = await response.json();
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';

    users.forEach(user => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <div class="user-row">
            <div class="avatar-small">
              <i class="fas fa-user-circle"></i>
            </div>
            <div>${user.id}</div>
          </div>
        </td>
        <td>${user.name}</td>
        <td>${user.role}</td>
        <td>${new Date(user.createdAt).toLocaleDateString()}</td>
        <td>
          <button class="table-btn" onclick="editUser('${user.id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="table-btn danger" onclick="deleteUser('${user.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      userList.appendChild(row);
    });
  } catch (error) {
    showError('Failed to fetch users');
  }
}

async function editUser(id) {
  try {
    const response = await fetchWithAuth(`${API_URL}/users/${id}`);
    if (!response) return;

    const user = await response.json();
    document.getElementById('user-content').innerHTML = getUserEditForm(user);
  } catch (error) {
    showError('Failed to load user for editing');
  }
}

async function fetchCurrentUserForEdit() {
  try {
    const response = await fetchWithAuth(`${API_URL}/users/me`);
    if (!response) {
      showError('Authentication failed');
      return;
    }

    if (response.ok) {
      const user = await response.json();
      const nameInput = document.getElementById('edit-user-name');
      const passwordInput = document.getElementById('edit-user-password');
      
      if (nameInput && passwordInput) {
        nameInput.value = user.name || '';
        passwordInput.value = '';
      } else {
        console.error('Form elements not found');
        showError('Unable to load profile form');
      }
    } else {
      const errorData = await response.json();
      showError(errorData.error || 'Failed to load your profile for editing');
    }
  } catch (error) {
    console.error('Fetch current user for edit error:', error);
    showError('Failed to load your profile for editing');
  }
}

async function saveUser(id) {
  const user = {
    name: document.getElementById('edit-user-name').value.trim(),
    password: document.getElementById('edit-user-password').value.trim() || undefined,
    role: currentUser.role === 'admin' ? document.getElementById('edit-user-role')?.value : currentUser.role
  };

  if (!user.password) delete user.password;

  if (!user.name) {
    showError('Username is required');
    return;
  }

  try {
    const response = await fetchWithAuth(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });

    if (!response) return;

    if (response.ok) {
      showSuccess('User updated successfully');
      if (id === currentUser.id) {
        currentUser.name = user.name;
        document.getElementById('username-display').textContent = `Welcome, ${currentUser.name}`;
      }
      loadUserOperation(currentUser.role === 'admin' ? 'list' : 'view-profile');
    } else {
      const data = await response.json();
      showError(data.error || 'Failed to update user');
    }
  } catch (error) {
    showError('Failed to update user');
  }
}

async function deleteUser(id) {
  if (currentUser.role !== 'admin') {
    showError('Only admins can delete users');
    return;
  }

  if (!confirm('Are you sure you want to delete this user?')) {
    return;
  }

  try {
    const response = await fetchWithAuth(`${API_URL}/users/${id}`, {
      method: 'DELETE'
    });

    if (!response) return;

    if (response.ok) {
      showSuccess('User deleted successfully');
      fetchUsers();
    } else {
      const data = await response.json();
      showError(data.error || 'Failed to delete user');
    }
  } catch (error) {
    showError('Failed to delete user');
  }
}

function renderVehicleCard(vehicle) {
  const brandImages = {
    'toyota': 'https://images.unsplash.com/photo-1580273916550-e323be2ae537',
    'honda': 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a',
    'ford': 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a',
    'bmw': 'https://images.unsplash.com/photo-1580274437635-c862c1f6b0e7',
    'mercedes': 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738'
  };
  
  const defaultImage = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70';
  const brandKey = vehicle.marque.toLowerCase();
  const imageUrl = brandImages[brandKey] || defaultImage;
  
  let reserveButton = '';
  if (currentUser.role !== 'admin') {
    reserveButton = `<button class="reserve-btn" onclick="reserveVehicle('${vehicle.id}')">Réserver</button>`;
  }
  
  return `
    <div class="vehicle-card">
      <div class="vehicle-image" style="background-image: url(${imageUrl})"></div>
      <div class="vehicle-details">
        <div class="vehicle-make-model">${vehicle.marque} ${vehicle.model}</div>
        <div class="vehicle-info">Immat: ${vehicle.immatriculation}</div>
        <div class="vehicle-info">Année: ${vehicle.annees}</div>
        <div class="vehicle-price">${vehicle.prixLocation}€/jour</div>
      </div>
      <div class="vehicle-actions">
        ${reserveButton}
        <button class="table-btn" onclick="editVehicle('${vehicle.id}')">
          <i class="fas fa-edit"></i> Modifier
        </button>
        <button class="table-btn danger" onclick="deleteVehicle('${vehicle.id}')">
          <i class="fas fa-trash"></i> Supprimer
        </button>
      </div>
    </div>
  `;
}

function reserveVehicle(id) {
  showSuccess(`Véhicule ${id} réservé avec succès !`);
  // Logique de réservation à implémenter ici
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    goBack();
  }
});

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
  showLogin();
});
