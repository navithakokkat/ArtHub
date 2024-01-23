// Login as an existing user
function login() {
    // Get user's username and password from textboxes
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
  
    // Send post request to server
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (xhttp.readyState == 4) {

        if (xhttp.status === 200) {
            // Login was successful, redirects to page with all artworks
            alert("Successfully logged in!")
            window.location.href = '/artworkSearch';
        } else if(xhttp.status === 201) {
            // User was already logged in
            alert("Already logged in!");
        } else {
            // Invalid login credentials
          alert("Incorrect username and/or password");
        }
      }
    };
  
    xhttp.open('POST', '/login');
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.send(JSON.stringify({ username, password }));
}

// Register as a new user
function register() {
    // Get new username and password from textboxes
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
  
    // Send post request to server
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (xhttp.readyState === XMLHttpRequest.DONE) {
        if (xhttp.status === 201) {
          // Registration was successful, redirects to page with all artworks
          alert("Successfully registered!");
          window.location.href = '/artworkSearch';
        } else if (xhttp.status === 400) {
          // Another user has this username
          alert("Username already exists");
        } else {
          // In case of unknown error
          alert('Registration failed');
        }
      }
    };
  
    xhttp.open('POST', '/register');
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.send(JSON.stringify({ username, password }));
}

// Displays artworks that match the filters
function refreshArtworks() {	
	req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if(this.readyState==4 && this.status==200){
            // Adds the artworks to the "results" div of the page
			document.getElementById("results").innerHTML = this.responseText;
		}
	}
	
    // Gets the filters from the textboxes
	let values = {}
	values.Title = document.getElementById("title").value;
	values.Artist = document.getElementById("artist").value;
	values.Category = document.getElementById("category").value;
	values.Medium = document.getElementById("medium").value;
	
    // Creates query for the filter
	let queries = [];
	for(key in values){
		if(values[key].length != 0){
			queries.push(key + "=" + values[key]);
		}
	}
	let queryString = queries.join("&");
	
	req.open("GET", `http://localhost:3000/artworks?${queryString}`);
	req.send();
}

// Adds or removes likes to an artwork
function like(artworkID) {
    const path = window.location.pathname;

    // Object to send to server
    let obj = {};
    if (document.getElementById("likeBtn").textContent == 'Like') {
        obj = {
            liked: 1
        };    
    } else {
        obj = {
            liked: -1
        }; 
    }

    // Sends put request to the server
    let xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
            
            const updatedArtwork = JSON.parse(this.responseText);
            // Updates the number of likes on the page
            document.getElementById("likesText").textContent = `Likes: ${updatedArtwork.Likes}`; 

            // Modifies the text on the button
            if (document.getElementById("likeBtn").textContent == 'Like') {
                document.getElementById("likeBtn").textContent = 'Unlike';
            } else {
                document.getElementById("likeBtn").textContent = 'Like'; 
            }
		} else if (this.readyState == 4 && this.status == 403) {
            // If user tries to like their own artwork
            alert("Cannot like your own artwork");
        }
	};

    xhttp.open("PUT", `${path}`);
    xhttp.setRequestHeader('Content-Type', 'application/json');
	xhttp.send(JSON.stringify(obj));
}

// Adds a review to an artwork
function review(artworkID) {
    const path = window.location.pathname;

    // Gets the review text
    const rev = document.getElementById('review').value;
    const obj = {
        reviewed: rev
    }; 

    // Sends put request to the server to update that artwork
    let xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
            // Refreshes the page to show the review
			window.location.href = window.location.href;
		} else if (this.readyState == 4 && this.status == 403) {
            // User tried to review their own artwork
            alert("Cannot review your own artwork");
        }
	};

    xhttp.open("PUT", `${path}`);
    xhttp.setRequestHeader('Content-Type', 'application/json');
	xhttp.send(JSON.stringify(obj));
}

// Deletes a review from an artwork
function deleteReview(artworkID, review) {
    const path = window.location.pathname;

    obj = {
        deleteReview: review
    }; 
    
    // Sends put request to the server to update that artwork
    let xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			window.location.href = window.location.href;
		}
	};

    xhttp.open("PUT", `${path}`);
    xhttp.setRequestHeader('Content-Type', 'application/json');
	xhttp.send(JSON.stringify(obj));
}

// Updates the category in the textbox of the page
function setCategory(category) {
    document.getElementById('category').value = category;
    refreshArtworks(); 
}

// Follow or unfollow another user
function follow(userID) {
    const path = window.location.pathname;

    let obj = {};
    if (document.getElementById("followBtn").textContent == 'Follow') {
        obj = {
            followed: 1
        };
    } else {
        obj = {
            followed: -1
        }; 
    }

    // Sends put request to the server
    let xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

            // Updates button text to Follow/Unfollow
            if (document.getElementById("followBtn").textContent == 'Follow') {
                document.getElementById("followBtn").textContent = 'Unfollow';
            } else {
                document.getElementById("followBtn").textContent = 'Follow'; 
            }
		}
	};

    xhttp.open("PUT", `${path}`);
    xhttp.setRequestHeader('Content-Type', 'application/json');
	xhttp.send(JSON.stringify(obj));
}

// Allows user to switch between patron and artist roles
function changeRole(userID) {

    const path = window.location.pathname;

    let obj = {};
    if (document.getElementById("changeRoleBtn").textContent == 'Switch to Artist') {
        obj = {
            role: "artist"
        };
    } else {
        obj = {
            role: "patron"
        }; 
    }

    // Sends put request to server
    let xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

            // Updates text and button text on page
            if (document.getElementById("changeRoleBtn").textContent == 'Switch to Artist') {
                document.getElementById("changeRoleBtn").textContent = 'Switch to Patron';
                document.getElementById("roleText").textContent = 'Current account type: Artist';
            } else {
                document.getElementById("changeRoleBtn").textContent = 'Switch to Artist'; 
                document.getElementById("roleText").textContent = 'Current account type: Patron';
            }
		} else if (this.readyState == 4 && this.status == 303) {
            // If patron wants to switch to artist, they must first add an artwork
            window.location.href = '/addArtwork';
        }
	};

    xhttp.open("PUT", `${path}`);
    xhttp.setRequestHeader('Content-Type', 'application/json');
	xhttp.send(JSON.stringify(obj));
}

// User uploads an artwork
function uploadArtwork() {
    // Get artwork's information from textboxes
    const title = document.getElementById('title').value;
    const year = document.getElementById('year').value;
    const category = document.getElementById('category').value;
    const medium = document.getElementById('medium').value;
    const description = document.getElementById('description').value;
    const poster = document.getElementById('poster').value;

    // Object to send to server
    let obj = {
        title: title,
        year: year,
        category: category,
        medium: medium,
        description: description,
        poster: poster
    }

    // Sends post request to the server
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (xhttp.readyState == 4) {
        if (xhttp.status === 200) {
            // Successful upload
            alert("Uploaded!");
            window.location.href = '/artworkSearch';
        } else if (xhttp.status === 422) { 
            // User did not fill out all required fields
            alert("Incomplete artwork information.");
        } else if (xhttp.status === 409) { 
            // Artworks cannot have the same title
            alert("Artwork with this title already exists.");
        } else {
            // Unknown error
            alert("Upload failed");
        }
      }
    };
  
    xhttp.open('POST', '/artworks');
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.send(JSON.stringify(obj));
}

// Create a new workshop
function createWorkshop() {
    // Gets title of new workshop from textbox
    const title = document.getElementById('title').value;
    obj = {
        title: title
    };

    // Sends post request to the server
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (xhttp.readyState == 4) {
        if (xhttp.status === 200) {
            // Successful creation
            alert("Workshop created!");
        } else if (xhttp.status === 422) { 
            // User did not enter a title for the workshop
            alert("Incomplete workshop information.");
        } else if (xhttp.status === 409) { 
            // Workshop title already exists
            alert("Workshop with this title already exists.");
        } else {
            // Unknown error
            alert("Creation failed");
        }
      }
    };
  
    xhttp.open('POST', '/workshops');
    xhttp.setRequestHeader('Content-Type', 'application/json');
    xhttp.send(JSON.stringify(obj));
}

// User enrolls or unenrolls in a workshop
function enroll() {
    const path = window.location.pathname;

    let obj = {};
    if (document.getElementById("enrollBtn").textContent == 'Enroll') {
        obj = {
            enrolled: 1
        };  
    } else {
        obj = {
            enrolled: -1
        }; 
    }

    // Sends put request to the server
    let xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4) {

            if (this.status == 200) {
                // Updates button text
                if (document.getElementById("enrollBtn").textContent == 'Enroll') {
                    document.getElementById("enrollBtn").textContent = 'Unenroll';
                    alert("Successfully enrolled!");
                } else {
                    document.getElementById("enrollBtn").textContent = 'Enroll'; 
                    alert("Successfully unenrolled!");
                }
            } else {
                // Error in enrollment
                alert("ERROR");
            }
		}
	};

    xhttp.open("PUT", `${path}`);
    xhttp.setRequestHeader('Content-Type', 'application/json');
	xhttp.send(JSON.stringify(obj));
}