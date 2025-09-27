// Variable to store the processed image URL
let imageURL;
// Note: `require` and `process.env` are Node.js features and not available in the browser.
// Read the API key from a meta tag, a global window variable, or prompt the user.

function getApiKey() {
  // 1) Try meta tag: <meta name="bg-remover-api-key" content="...">
  const meta = document.querySelector('meta[name="bg-remover-api-key"]');
  if (meta && meta.content && meta.content.trim() !== '') return meta.content.trim();

  // 2) Try window global set by another script (optional)
  if (window.BG_REMOVER_API && window.BG_REMOVER_API.trim() !== '') return window.BG_REMOVER_API.trim();

  // 3) Ask the user at runtime (useful for local dev). Do NOT use this for production.
  const key = prompt('Enter your remove.bg API key (for this session only):');
  return key ? key.trim() : '';
}

/* File Upload Event Listener Section Start */
document.getElementById('file').addEventListener('change', async function (event) {
  const fileInput = document.getElementById('file'); // Get the file input element
  const file = fileInput.files[0]; // Get the selected file

  // Validate file type
  if (!file || !file.type.startsWith('image/')) { // Check if file exists and is an image
    alert('Please select a valid image file (JPEG, PNG, etc.).'); // Show error message
    fileInput.value = ''; // Reset file input
    return; // Exit function
  }

  // Hide upload button and show loader
  document.querySelector('.input-div').style.display = 'none'; // Hide upload button
  document.querySelector('.p').style.display = 'none'; // Hide instruction text
  document.querySelector('.spinner').style.display = 'block'; // Show loader

  const formData = new FormData(); // Create a new FormData object
  formData.append('image_file', file); // Append the file to the form data
  formData.append('size', 'auto'); // Specify the size parameter

  const apiKey = getApiKey();

  if (!apiKey) {
    alert('API key is missing. Please add your API key to a meta tag in index.html or enter it when prompted.');
    // Reset UI
    document.querySelector('.spinner').style.display = 'none';
    document.querySelector('.input-div').style.display = 'flex';
    document.querySelector('.p').style.display = 'block';
    fileInput.value = '';
    return;
  }

  try {
    const response = await fetch('https://api.remove.bg/v1.0/removebg', { // Send request to Remove.bg API
      method: 'POST', // HTTP method
      headers: { 'X-Api-Key': apiKey }, // API key header
      body: formData // Form data as body
    });

    if (!response.ok) { // Check for HTTP errors
      const errorText = await response.text(); // Get error details
      throw new Error(`API Error: ${response.status} - ${errorText}`); // Throw error
    }

    const blob = await response.blob(); // Get the response as a blob
    imageURL = URL.createObjectURL(blob); // Create a URL for the blob

    // Show result and hide loader
    document.querySelector('.spinner').style.display = 'none'; // Hide loader
    document.querySelector('.result').style.display = 'block'; // Show result section
    document.getElementById('resultImage').src = imageURL; // Set the image source

  } catch (error) {
    console.error('Error:', error); // Log the error

    // Handle specific error cases
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      alert('Network Error: No internet connection detected.'); // Network error
    } else if (error.message.includes('402')) {
      alert('API Limit Reached: Please check your Remove.bg API plan.'); // API limit error
    } else if (error.message.includes('401')) {
      alert('Authentication Failed: Invalid API key.'); // Invalid API key
    } else {
      alert('An unexpected error occurred. Please try again.'); // Generic error
    }

    // Reset UI on error
    document.querySelector('.spinner').style.display = 'none'; // Hide loader
    document.querySelector('.input-div').style.display = 'flex'; // Show upload button
    document.querySelector('.p').style.display = 'block'; // Show instruction text
  }
});
/* File Upload Event Listener Section End */

/* Download Functionality Section Start */
function downloadFile() {
  if (!imageURL) { // Check if image URL exists
    alert("No image to download!"); // Show error message
    return; // Exit function
  }
  const a = document.createElement('a'); // Create a temporary anchor element
  a.href = imageURL; // Set the download link
  a.download = 'background_removed_image.png'; // Set the file name
  document.body.appendChild(a); // Append to the DOM
  a.click(); // Trigger the download
  document.body.removeChild(a); // Remove the anchor element
}
/* Download Functionality Section End */

/* Online/Offline Detection Section Start */
const connectionStatus = document.getElementById('connectionStatus'); // Get the connection status element

window.addEventListener('online', updateConnectionStatus); // Listen for online event
window.addEventListener('offline', updateConnectionStatus); // Listen for offline event

function updateConnectionStatus() {
  if (navigator.onLine) { // Check if online
    connectionStatus.style.display = 'none'; // Hide the offline message
  } else {
    connectionStatus.style.display = 'block'; // Show the offline message
    connectionStatus.textContent = 'You are offline. Check Your Internet Connection!'; // Update text
    connectionStatus.style.backgroundColor = '#ff4444'; // Update background color
  }
}

// Initial check for connection status
updateConnectionStatus();
/* Online/Offline Detection Section End */