document.addEventListener('DOMContentLoaded', () => {
  // Initialize filter input event listener
  const filterInput = document.getElementById('filterInput');
  filterInput.addEventListener('input', () => {
    const cookies = JSON.parse(document.getElementById('cookieOutput').getAttribute('data-cookies') || '[]');
    displayCookies(cookies, filterInput.value.toLowerCase());
  });

  // Initialize copy button
  document.getElementById('copyButton').addEventListener('click', () => {
    const cookies = JSON.parse(document.getElementById('cookieOutput').getAttribute('data-cookies') || '[]');
    const cookieText = JSON.stringify(cookies, null, 2);
    navigator.clipboard.writeText(cookieText);
    
    const copyButton = document.getElementById('copyButton');
    copyButton.textContent = 'Copied!';
    setTimeout(() => {
      copyButton.textContent = 'Copy All';
    }, 1500);
  });

  // Initialize extract button
  document.getElementById('extractCookies').addEventListener('click', extractCookies);
});

function displayCookies(cookies, filterText = '') {
  const output = document.getElementById('cookieOutput');
  const filteredCookies = cookies.filter(cookie => 
    cookie.name.toLowerCase().includes(filterText) || 
    cookie.domain.toLowerCase().includes(filterText) ||
    cookie.value.toLowerCase().includes(filterText)
  );

  if (filteredCookies.length === 0) {
    output.innerHTML = '<div class="no-cookies">No matching cookies found</div>';
  } else {
    output.innerHTML = filteredCookies.map(cookie => `
      <div class="cookie-item">
        <div class="cookie-header">
          <span class="cookie-name">${escapeHtml(cookie.name)}</span>
          <span class="cookie-domain">${escapeHtml(cookie.domain)}</span>
        </div>
        <div class="cookie-value">${escapeHtml(cookie.value)}</div>
      </div>
    `).join('');
  }
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function extractCookies() {
  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Get all cookies from the current domain
    const url = new URL(tab.url);
    const baseDomain = url.hostname.split('.').slice(-2).join('.');
    
    const cookies = await chrome.cookies.getAll({
      domain: baseDomain
    });

    const cookieData = cookies.map(cookie => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain
    }));

    // Store the full cookie data for filtering
    document.getElementById('cookieOutput').setAttribute('data-cookies', JSON.stringify(cookieData));
    
    // Update cookie count
    document.getElementById('cookieCount').textContent = `Found ${cookies.length} cookies`;
    
    // Display cookies
    displayCookies(cookieData, document.getElementById('filterInput').value.toLowerCase());
    
    // Show the filter and copy sections
    document.getElementById('controls').style.display = 'block';
  } catch (error) {
    document.getElementById('cookieOutput').innerHTML = `
      <div class="error">Error: ${escapeHtml(error.message)}</div>
    `;
  }
}