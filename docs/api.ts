interface Track {
  name: string;
  artist: string;
  url: string;
  duration: string;
  durationSeconds: number;
}

export async function fetchTracks(): Promise<Track[]> {
  try {
    const response = await fetch("/api/tracks");

    // Check if response is ok
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check content type
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Received non-JSON response:", text.substring(0, 200));
      throw new Error(`Expected JSON but received: ${contentType}`);
    }

    const tracks = await response.json();

    if (!Array.isArray(tracks)) {
      throw new Error("Tracks data is not an array");
    }

    return tracks;
  } catch (error) {
    console.error("Error fetching tracks:", error);
    // Return empty array as fallback
    return [];
  }
}
