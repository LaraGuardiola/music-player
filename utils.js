// utils.js
// Function to fetch tracks data from the /api/tracks endpoint
async function fetchTracks() {
  try {
    const response = await fetch('/api/tracks');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return [];
  }
}

// Export the function for use in other modules
export { fetchTracks };
