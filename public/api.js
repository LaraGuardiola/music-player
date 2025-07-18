async function fetchTracks() {
  try {
    const response = await fetch("http://localhost:3030/api/tracks");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching tracks:", error);
    return [];
  }
}

export { fetchTracks };
