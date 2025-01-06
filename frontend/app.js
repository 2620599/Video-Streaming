const API_BASE = "http://34.203.169.113"; // Server IP

// Define the URLs for each service
const USER_SERVICE_URL = `${API_BASE}:3001`; // User service
const UPLOAD_SERVICE_URL = `${API_BASE}:3002`; // Upload service
const WATCHLIST_SERVICE_URL = `${API_BASE}:3004`; // Watchlist service
const RECOMMENDATION_SERVICE_URL = `${API_BASE}:3005`; // Recommendation service
const STREAMING_SERVICE_URL = `${API_BASE}:3003`; // Streaming service

let currentUser = null; // Store the current logged-in user

// Event listeners for buttons
document.getElementById("loginBtn").addEventListener("click", showLoginForm);
document.getElementById("logoutBtn").addEventListener("click", logout);

function showLoginForm() {
  document.getElementById("loginForm").style.display = 'block';
  document.getElementById("registerForm").style.display = 'none';
}

function login() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    fetch(`${USER_SERVICE_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.user) {
            currentUser = data.user;
            // Add admin role if it's the admin email
            if (email === 'admin@gmail.com') {
                currentUser.role = 'admin';
            }
            // Store user information
            document.cookie = `userId=${data.user._id}; path=/`;
            showUserDashboard();
        } else {
            alert("Login failed");
        }
    })
    .catch(error => {
        console.error("Error during login:", error);
        alert("An error occurred while logging in");
    });
}

function logout() {
  document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/"; // Clear user cookie
  currentUser = null;
  showLoginForm();

}
// Show user dashboard
function showUserDashboard() {
    // Hide login/register, show dashboard
    document.getElementById("loginForm").style.display = 'none';
    document.getElementById("registerForm").style.display = 'none';
    document.getElementById("userDashboard").style.display = 'block';
    
    // Show/hide upload form based on admin status
    document.getElementById("uploadForm").style.display = 
        (currentUser && currentUser.email === 'admin@gmail.com') ? 'block' : 'none';
    
    // Show dashboard sections
    document.getElementById("videos").style.display = 'block';
    document.getElementById("watchlistItems").style.display = 'block';
    document.getElementById("recommendedVideos").style.display = 'block';
    document.getElementById("videoPlayer").style.display = 'block';
    
    // Update username
    document.getElementById("userName").textContent = currentUser.username || "User";
    //document.getElementById("logoutButton").style.display = 'block';
    // Fetch data
    fetchVideos();
    fetchWatchlist();
    fetchRecommendations();
    document.getElementById("loginBtn").style.display = 'none';  // Hide login button
    document.getElementById("logoutBtn").style.display = 'block'; // Show logout button
}

function register() {
  const username = document.getElementById("registerUsername").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  fetch(`${USER_SERVICE_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, email, password }),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    alert("Registration successful!");
    showLoginForm();
  })
  .catch(error => {
    console.error("Registration error:", error);
    alert("Registration failed: " + error.message);
  });
}
// Add this function to your app.js
// Fetch and display videos
function fetchVideos() {
    fetch(`${STREAMING_SERVICE_URL}/api/videos`)
        .then(response => response.json())
        .then(videos => {
            const videosContainer = document.getElementById('videos');
            videosContainer.innerHTML = ''; // Clear existing videos
            
            videos.forEach(video => {
                const videoCard = document.createElement('div');
                videoCard.className = 'video-item';
                videoCard.innerHTML = `
                    <h3>${video.title}</h3>
                    <p>${video.description}</p>
                    <button onclick="streamVideo('${video._id}')">Play Video</button>
                    <button onclick="addToWatchlist('${video._id}')">Add to Watchlist</button> <!-- Added Button -->
                `;
                videosContainer.appendChild(videoCard);
            });
        })
        .catch(error => console.error('Error:', error));
}
function fetchWatchlist() {
    fetch(`${WATCHLIST_SERVICE_URL}/api/watchlist`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(watchlist => {
            const watchlistContainer = document.getElementById("watchlistItems");
            watchlistContainer.innerHTML = ""; // Clear previous data

            if (!watchlist || watchlist.length === 0) {
                watchlistContainer.innerHTML = "<li>No videos in your watchlist</li>";
                return;
            }

            watchlist.forEach(item => {
                // Check if video exists and has a valid _id
                if (!item.video || !item.video._id) {
                    console.error("Error: Video not found for item", item);
                    return;
                }

                const li = document.createElement("li");
                li.innerHTML = `
                    <a href="javascript:void(0);" onclick="streamVideo('${item.video._id}')">
                        🎥 ${item.video.title} - ${item.video.description || "No description available"}
                    </a>
                `;
                watchlistContainer.appendChild(li);
            });
        })
        .catch(error => {
            console.error("Error fetching watchlist:", error);
            alert("Error fetching watchlist");
        });
}

function fetchRecommendations() {
    fetch(`${WATCHLIST_SERVICE_URL}/api/watchlist`)
        .then(response => response.json())
        .then(watchlist => {
            if (!watchlist || watchlist.length === 0) {
                console.warn("No watchlist items found, skipping recommendations.");
                return;
            }

            const watchedVideoIds = watchlist.map(item => item.videoId); // Extract video IDs from watchlist

            return fetch(`${RECOMMENDATION_SERVICE_URL}/api/recommendations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ watchedVideos: watchedVideoIds }),
            });
        })
        .then(response => response.json())
        .then(recommendedVideos => {
            const recommendedContainer = document.getElementById("recommendedVideos");
            recommendedContainer.innerHTML = "";

            if (!recommendedVideos || recommendedVideos.length === 0) {
                recommendedContainer.innerHTML = "<li>No recommendations available</li>";
                return;
            }

            recommendedVideos.forEach(video => {
                const li = document.createElement("li");
                li.innerHTML = `
                    <a href="#" onclick="streamVideo('${video._id}')">
                        ⭐ ${video.title} - ${video.description}
                    </a>
                `;
                recommendedContainer.appendChild(li);
            });
        })
        .catch(error => console.error("Error fetching recommendations:", error));
}


function showRegisterForm() {
  document.getElementById("loginForm").style.display = 'none';
  document.getElementById("registerForm").style.display = 'block';
}

// Function to play video from streaming service
function streamVideo(videoId) {
    const videoPlayer = document.getElementById("videoPlayer");

    fetch(`${STREAMING_SERVICE_URL}/api/stream/${videoId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Video not found');
            }
            return response.json();
        })
        .then(videoData => {
            if (!videoData.fileUrl) {  // Use fileUrl instead of streamUrl
                throw new Error('Video URL not found');
            }
            videoPlayer.src = videoData.fileUrl; // Update source to fileUrl

            // Update video metadata if needed
            if (videoData.title) {
                document.getElementById("videoTitle").textContent = videoData.title;
            }
            if (videoData.description) {
                document.getElementById("videoDescription").textContent = videoData.description;
            }

            videoPlayer.load();
            videoPlayer.play()
                .catch(e => console.error('Playback failed:', e));
        })
        .catch(error => {
            console.error('Streaming error:', error);
            alert("Error streaming video: " + error.message);
        });
}

// Handle file upload for videos
function uploadVideo() {
    const title = document.getElementById("videoTitle").value;
    const description = document.getElementById("videoDescription").value;
    const file = document.getElementById("videoFile").files[0];
    
    if (!title || !description || !file) {
        alert("Please fill all fields and select a file.");
        return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("file", file);

    fetch(`${UPLOAD_SERVICE_URL}/api/videos`, {
        method: "POST",
        body: formData,
        headers: {
            'Accept': 'application/json'
        },
        // Remove credentials if your server doesn't support it
        // credentials: 'include',
        // Add mode: 'cors' to explicitly handle CORS
        mode: 'cors'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        alert("Video uploaded successfully!");
        fetchVideos();
        document.getElementById("videoTitle").value = '';
        document.getElementById("videoDescription").value = '';
        document.getElementById("videoFile").value = '';
    })
    .catch(error => {
        console.error("Upload error:", error);
        alert("Upload failed");
    });
}
function addToWatchlist(videoId) {
    fetch(`${WATCHLIST_SERVICE_URL}/api/watchlist`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoId }),  // Send only videoId
    })
    .then(response => response.json())
    .then(data => {
        alert("Added to watchlist");
        fetchWatchlist();  // Reload the watchlist after adding
    })
    .catch(error => {
        console.error("Error adding to watchlist:", error);
        alert("An error occurred while adding to watchlist");
    });
}

function displayVideos(videos) {
  const videoList = document.getElementById("videoList");
  videoList.innerHTML = "";

  videos.forEach(video => {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = "#";
    link.textContent = video.title;
    link.onclick = () => streamVideo(video._id);

    const addButton = document.createElement("button");
    addButton.textContent = "Add to Watchlist";
    addButton.onclick = () => addToWatchlist(video._id);

    li.appendChild(link);
    li.appendChild(addButton);
    videoList.appendChild(li);
  });
}
