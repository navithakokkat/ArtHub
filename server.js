const express = require('express');
let app = express(); 
app.use(express.static("public"));
app.use(express.json()); 

// Views
app.set("view engine", "pug"); 
app.set("views","./public/views/pages" );
app.use('/public', express.static('public', { 'extensions': ['html', 'js'] }));

const session = require('express-session');
const mongoose = require("mongoose");
mongoose.connect('mongodb://127.0.0.1/finalproject');

// Schemas
const User = require("./UserModel");
const Artwork = require("./ArtworkModel");
const Workshop = require("./WorkshopModel");

let db = mongoose.connection;

// Collections from database
const artworksCollection = db.collection("artworks");
const usersCollection = db.collection("users");
const workshopsCollection = db.collection("workshops");

// Use session for login/logout
app.use(session({
    secret: 'some secret here',
    resave: true,
    saveUninitialized: true
}));

// Renders home page for login/registration
app.get('/', function  (req, res){
	res.render("home", {}); 
}); 

// User login
app.post('/login', async (req, res) => {
    // Gets username and password from request
    const { username, password } = req.body;

    // Checks session to see if user was already logged in
    if(req.session.user && req.session.user.loggedin) {
        return res.status(201).send("Already logged in");
    }
  
    try {
        // Checks if user exists with that username and password combination
        const user = await User.findOne({ Username:username });
        if (!user || user.Password !== password) {
            return res.status(401).send("Invalid credentials");
        }
  
        // Session data to store user info
        req.session.user = {
            id: user._id,
            username: user.Username,
            role: user.Role,
            loggedin: true,
            allowAdd: false
        };
  
        res.status(200).send("Logged in successfully");
    } catch (error) {
        res.status(500).send("Error during login");
    }
});

// User registration
app.post('/register', async (req, res) => {
    // Gets new username and password
    const { username, password } = req.body;
  
    try {
      // Checks if username already exists
      const existingUser = await User.findOne({ Username:username });
      if (existingUser) {
        return res.status(400).send('Username already exists');
      }
  
      // Creates and saves new user
      const newUser = new User({ Username:username, Password:password });
      await newUser.save();
  
      // Sets the session for the user
      req.session.user = {
        id: newUser._id,
        username: newUser.Username,
        role: newUser.Role,
        loggedin: true,
        allowAdd: false
      };
  
      res.status(201).send('User registered successfully');
    } catch (error) {
      res.status(500).send('Error during registration');
    }
});

app.get('/logout', (req, res) => {
    if (req.session.user && req.session.user.loggedin) {
		req.session.user.loggedin = false;
		req.session.user.username = undefined;
        req.session.user.id = undefined;  
        req.session.user.role = undefined;      
		//res.status(200).send("Logged out.");
        res.redirect('/');
	} else {
		res.status(200).send("You cannot log out because you aren't logged in.");
	}
});

// Function that checks if user is logged in
function checkLoggedIn(req, res, next) {
    if (req.session && req.session.user && req.session.user.loggedin) {
      // If  user is logged in, continue
      next();
    } else {
      // If user is not logged in, don't allow to continue
      res.status(401).send('Unauthorized access. Please log in.');
      return;
    }
};

// Renders artworkSearch page if user is logged in
app.get('/artworkSearch', checkLoggedIn, sendArtworkSearch);
function sendArtworkSearch (req, res){
	res.render("artworkSearch", {});
}; 

// Sends all of artworks that match the filter
app.get("/artworks", checkLoggedIn, parseQuery, loadArtworks, sendArtworks);

// Parses the query and creates a MongoDB query based on title, artist, category, and medium
function parseQuery(req, res, next) {
    let matches = [];
  
    if (req.query.Title) {
      matches.push({ Title: { $regex: '.*' + req.query.Title + '.*', $options: 'i' } });
    }
    if (req.query.Artist) {
      matches.push({ Artist: { $regex: '.*' + req.query.Artist + '.*', $options: 'i' } });
    }
    if (req.query.Category) {
      matches.push({ Category: { $regex: '.*' + req.query.Category + '.*', $options: 'i' } });
    }
    if (req.query.Medium) {
        matches.push({ Medium: { $regex: '.*' + req.query.Medium + '.*', $options: 'i' } });
      }
  
    let queryDoc = {};
    if (matches.length > 0) {
      queryDoc = { $and: matches };
    }
    req.queryDoc = queryDoc;
    next();
}

// Finds all artworks that match the query
async function loadArtworks(req, res, next) {
    try {
        const query = req.queryDoc;
        const artworksResults = await artworksCollection.find(query).toArray();
        res.artworks = artworksResults;

        next();
    } catch (error) {
        res.status(500).send('Error loading artworks');
    }
}

// Renders the artworksList page with the matching artworks
function sendArtworks(req, res, next) {
    res.status(200).render("artworksList", { artworks: res.artworks });
}

// Renders a specific artwork's page
app.get("/artworks/:artworkID", checkLoggedIn, sendArtwork);
async function sendArtwork(req, res, next) {
    let query = { "_id": new mongoose.Types.ObjectId(req.params.artworkID) }
	const artworkData = await artworksCollection.findOne(query);

	if (!artworkData) {
		res.status(404).send("Artwork not found. Unknown ID.");
		return;
	} else {
        // Gets user from session information
        let query2 = { "_id": new mongoose.Types.ObjectId(req.session.user.id) }
        const userData = await usersCollection.findOne(query2);

        // Checks if user has liked this artwork
        let Like = true;
        if (userData.Liked.includes(artworkData._id.toString())) {
            Like = false;
        }

        // Finds artist of artwork so that the link to the artist's page can be shown
        const artist = await User.findOne({ Username: artworkData.Artist });

        res.format({
            "text/html": () => {
                res.status(200).render("artwork", { artwork: artworkData, artist: artist, likeText: Like });
                return;
            },
            "application/json": () => {
                res.json(artworkData);
                return;
            },
            default: () => {
                res.status(404).send("Unknown resource");
            }
        })
		return;
	}
}

// Updates the artwork if a like or review is added/removed
app.put("/artworks/:artworkID", checkLoggedIn, updateArtwork);
async function updateArtwork(req, res){
	const artworkID = req.params.artworkID;

    try {
        // Find the artwork by ID
        const artwork = await Artwork.findById(artworkID);
        const user = await User.findById(req.session.user.id);

        if (!artwork) {
            return res.status(404).send('Artwork not found');
        }

        // Does not allow the user to like/review their own artwork
        if (req.session.user && artwork.Artist === req.session.user.username) {
            return res.status(403).send('Cannot like or review your own artwork');
        }

        // Update the likes count and add to or remove from user's array of Liked artworks
        if(req.body.liked) {
            if (req.body.liked === 1) {
                artwork.Likes += 1;
                await artwork.save();
                user.Liked.push(artworkID);
                await user.save();
            } else if (req.body.liked === -1){
                artwork.Likes -= 1;
                await artwork.save();
                user.Liked = user.Liked.filter(id => id !== artworkID);
                await user.save();
            }
        }

        // Add a review
        if(req.body.reviewed){
            // Creates String for the review
            const username = req.session.user.username;
            const reviewText = req.body.reviewed;
            const review = `${username}: ${reviewText}`;

            // Updates artwork's reviews and user's array of reviewed artworks
            artwork.Reviews.push(review);
            await artwork.save();
            user.Reviewed.push(artworkID);
            await user.save();
        }

        // Delete a review
        if (req.body.deleteReview) {
            const reviewToDelete = req.body.deleteReview;
        
            // Deletes the review if it is the user's own review
            artwork.Reviews = artwork.Reviews.filter(review => {
                const parts = review.split(":");
                if (parts.length > 1 && parts[0] === req.session.user.username) {
                    return review !== reviewToDelete;
                }
                return true;
            });

            // Saves artwork
            await artwork.save();
        
            // Removes artwork from user's array of Reviewed artworks
            user.Reviewed = user.Reviewed.filter(id => {
                return id !== artworkID;
            });
            // Saves user
            await user.save();
        }
        
        res.status(200).json(artwork);
    } catch (error) {
        res.status(500).send('Error updating artwork');
    }
}

// Renders page for individual user
app.get("/users/:userID", checkLoggedIn, sendUser);

async function sendUser(req,res) {
    // Gets user whose page will be rendered
    try {
        let query = { "_id": new mongoose.Types.ObjectId(req.params.userID) }
    
        const userData = await usersCollection.findOne(query);
        
        if (!userData) {
            res.status(404).send("User not found. Unknown ID.");
            return;
        } else {
            // Gets current user who is logged in
            let query2 = { "_id": new mongoose.Types.ObjectId(req.session.user.id) }
            const currentUser = await usersCollection.findOne(query2);

            // Checks if the current user is already following the user
            let Follow = true;
            if (currentUser.Following.includes(userData._id.toString())) {
                Follow = false;
            }

            // Checks if user is requesting their own page
            let myProfile = false;
            if (userData._id == req.session.user.id) {
                myProfile = true;
            }

            // Gets all the information to pass into the pug file to display
            const artworkNames = userData.Artworks;
            const artworks = await Artwork.find({ Title: { $in: artworkNames } });

            const workshopNames = userData.Workshops;
            const workshops = await Workshop.find({ Title: { $in: workshopNames } });

            const followingNames = userData.Following;
            const followings = await User.find({ _id: { $in: followingNames } });

            const followerNames = userData.Followers;
            const followers = await User.find({ _id: { $in: followerNames } });

            const notifications = userData.Notifications;

            const enrolledWorkshopNames = userData.EnrolledWorkshops;
            const enrolledWorkshops = await Workshop.find({ _id: { $in: enrolledWorkshopNames } });

            res.format({
                "text/html": () => {
                    res.status(200).render("user", { Username: userData.Username, UserRole: userData.Role, UserID: userData._id, Artworks: artworks, Workshops: workshops, Followings: followings, Followers: followers, Notifications: notifications, EnrolledWorkshops: enrolledWorkshops, Me: myProfile, followText: Follow });
                    return;
                },
                "application/json": () => {
                    res.json(userData);
                    return;
                },
                default: () => {
                    res.status(404).send("Unknown resource");
                }
            })
            
            return;
        }
    } catch {
        res.status(404).send("Unknown resource");
    }
}

// Updates user for follow/unfollow requests or for changing roles
app.put("/users/:userID", checkLoggedIn, updateUser);
async function updateUser(req, res){
	const userID = req.params.userID;

    try {
        // For follow/unfollow requests
        if(req.body.followed) {

            // Get the user to follow and the current user
            const userToFollow = await User.findById(userID);
            const user = await User.findById(req.session.user.id);

            if (!userToFollow) {
                return res.status(404).send('User not found');
            }

            // Check if the user is trying to follow themself
            if (req.session.user && userToFollow.Username === req.session.user.username) {
                return res.status(403).send('Cannot follow yourself');
            }

            // Update the arrays for Follwers for the user to follow, and Following for current user
            if (req.body.followed === 1) {
                // If followed
                userToFollow.Followers.push(req.session.user.id);
                await userToFollow.save();
                user.Following.push(userID);
                await user.save();

            } else if (req.body.followed === -1){
                // If unfollowed
                userToFollow.Followers = userToFollow.Followers.filter(followerId => followerId !== req.session.user.id);
                await userToFollow.save();
                user.Following = user.Following.filter(followingId => followingId !== userID);
                await user.save();
            }
        
            res.status(200).send();

        // For requests to change role 
        } else if (req.body.role) {
            // Get the currently logged in user 
            const currentUser = await User.findById(req.session.user.id);

            // If they are an artist, switch to patron
            if (currentUser.Role == "artist") {
                currentUser.Role = req.body.role;
                await currentUser.save();
                // User is now a patron
                req.session.user.role = "patron"; 
                req.session.user.allowAdd = false; // Not allowed to add an artwork or workshop
                res.status(200).json(currentUser);

            // If they are a patron with no artworks
            } else if (currentUser.Role == "patron" && currentUser.Artworks.length == 0) {
                // Allows user to add artworks
                // Does not change to artist here, since this will only be done after they have added an artwork
                req.session.user.allowAdd = true;
                // Sends status code 303 to redirect to the addArtworks page
                res.status(303).json(currentUser);

            // If they are a patron with previous artworks, switch to artist
            } else if (currentUser.Role == "patron" && currentUser.Artworks.length > 0) {
                currentUser.Role = req.body.role;
                await currentUser.save();
                // User is now an artist
                req.session.user.role = "artist"; 
                res.status(200).json(currentUser);
            }   
        }
    } catch (error) {
        res.status(500).send('Error updating user');
    }
}


// Renders the page to add an artwork
function addArtworkPage(req,res) {
    // Checks if user is an artist, OR if they are a patron that has tried to switch to an artist
    if (req.session.user.allowAdd || req.session.user.role == "artist"){
        req.session.user.allowAdd = false;
        res.render("addArtwork", {});
    } else {
        res.status(401).send('Only artists can add artworks.');
    }
}

// Creates and adds new artwork
app.post("/artworks", checkLoggedIn, addArtwork);
async function addArtwork(req,res) {
    // Gets artwork information from request
    const { title, year, category, medium, description, poster } = req.body;

    // Makes sure all required fields are there
    if (!title || !year || !category || !medium || !poster) {
        // Incomplete artwork information. Unprocessable Entity status code
        res.status(422).send(); 
        return;
    }

    // Checks for an existing artwork with the same title
    const existingArtwork = await Artwork.findOne({ Title: title });
    if (existingArtwork) {
        //  Artwork with this title already exists. Conflict status code
        res.status(409).send(); 
        return;
    }

    // Creates the new Artwork 
    const newArtwork = new Artwork({
        Title: title,
        Year: year,
        Category: category,
        Medium: medium,
        Description: description,
        Poster: poster,
        Artist: req.session.user.username // Set the artist field from the session
    });
    // Save the new artwork to the database
    await newArtwork.save();

    // Updates the user's array of Artworks
    const currentUser = await User.findOne({ Username: req.session.user.username });
    currentUser.Artworks.push(newArtwork.Title);

    // If user is already an artist, this does not affect it
    // If user was a patron, now that they added an artwork, they are an artist
    currentUser.Role = "artist";
    await currentUser.save();
    req.session.user.role = "artist"; 

    // Notify all followers
    const userFollowers = await User.find({ _id: { $in: currentUser.Followers } });

    const notificationMessage = `${req.session.user.username} uploaded a new artwork: ${title}`;

    for (const follower of userFollowers) {
        follower.Notifications.push(notificationMessage);
        await follower.save();
    }
    res.status(200).send();
}

// Get request for rendering page to add artwork
app.get("/addArtwork", checkLoggedIn, addArtworkPage);


// Get request for rendering page to add a workshop
app.get("/addWorkshop", checkLoggedIn, addWorkshopPage);

// Renders the page to add a workshop
function addWorkshopPage(req,res) {
    // Checks if user is an artist first
    if (req.session.user.role == "artist"){
        res.render("addWorkshop", {});
    } else {
        res.status(401).send('Only artists can host workshops.');
    }
}

// Creates and adds the workshop
app.post("/workshops", checkLoggedIn, addWorkshop);
async function addWorkshop(req,res) {

    // Gets workshop title from request
    const { title } = req.body;

    // Makes sure title field was there
    if (!title) {
        // 'Incomplete workshop information.' Unprocessable Entity
        res.status(422).send(); 
        return;
    }

    // Checks for existing workshop with the same title
    const existingWorkshop = await Workshop.findOne({ Title: title });
    if (existingWorkshop) {
        //  'Workshop with this title already exists.' Conflict
        res.status(409).send(); 
        return;
    }

    // Get current user
    let query = { "_id": new mongoose.Types.ObjectId(req.session.user.id) }
    const userData = await usersCollection.findOne(query);

    // Create the new Artwork
    const newWorkshop = new Workshop({
        Title: title,
        Host: req.session.user.id // Host is the currently logged in user
    });
    // Save the new artwork to the database
    await newWorkshop.save();

    // Update current user's list of Workshops
    const currentUser = await User.findOne({ Username: req.session.user.username });
    currentUser.Workshops.push(newWorkshop.Title);
    await currentUser.save();
    
    // Notify all followers
    const userFollowers = await User.find({ _id: { $in: currentUser.Followers } });

    const notificationMessage = `${req.session.user.username} will be hosting a new workshop: ${title}`;

    for (const follower of userFollowers) {
        follower.Notifications.push(notificationMessage);
        await follower.save();
    }

    res.status(200).send();
}

// Renders a specific workshop's page
app.get("/workshops/:workshopID", checkLoggedIn, sendWorkshop);
async function sendWorkshop(req, res, next) {

    // Gets workshop from the given ID
    let query = { "_id": new mongoose.Types.ObjectId(req.params.workshopID) }
	const workshopData = await workshopsCollection.findOne(query);

	if (!workshopData) {
		res.status(404).send("Workshop not found. Unknown ID.");
		return;
	} else {
        // Checks if user is enrolled in this workshop
        let query2 = { "_id": new mongoose.Types.ObjectId(req.session.user.id) }
        const currentUser = await usersCollection.findOne(query2);
        let Enroll = true;
        if (currentUser.EnrolledWorkshops.includes(workshopData._id.toString())) {
            Enroll = false;
        }

        // Checks if user is looking at their own workshop's page
        // If so, will prevent them from being able to enroll
        let myProfile = false;
        if (workshopData.Host == req.session.user.id) {
            myProfile = true;
        }

        // Gets workshop infromation to display on page
        const enrolledUsersIds = workshopData.EnrolledUsers;
        const enrolledUsers = await User.find({ _id: { $in: enrolledUsersIds } });

        let queryHost = { "_id": new mongoose.Types.ObjectId(workshopData.Host) }
        const host = await usersCollection.findOne(queryHost);

        res.format({
            "text/html": () => {
                res.status(200).render("workshop", { Title: workshopData.Title, Host: host, EnrolledUsers: enrolledUsers, Me: myProfile, enrollText: Enroll });
                return;
            },
            "application/json": () => {
                res.json(workshopData);
                return;
            },
            default: () => {
                res.status(404).send("Unknown resource");
            }
        })
		return;
	}
}

// Updates workshop for enrollment/unenrollment
app.put("/workshops/:workshopID", checkLoggedIn, updateWorkshop);
async function updateWorkshop(req, res){

	const workshopID = req.params.workshopID;
    const user = await User.findById(req.session.user.id);

    try {
        // Find the workshop by ID
        const workshop = await Workshop.findById(workshopID);

        if (!workshop) {
            return res.status(404).send('Workshop not found');
        }

        // Check if user is trying to enroll in their own workshop
        if (workshop.Host === user._id) {
            return res.status(403).send('Cannot enroll in your own workshop'); 
        }

        // Update the workshop's array of Enrolled Users and the user's array of Enrolled Workshops

        // Enrolled
        if (req.body.enrolled === 1) {
            workshop.EnrolledUsers.push(req.session.user.id);
            await workshop.save();
            user.EnrolledWorkshops.push(workshopID);
            await user.save();
            res.status(200).json(workshop);

        // Unenrolled
        } else if (req.body.enrolled === -1){
            workshop.EnrolledUsers = workshop.EnrolledUsers.filter(userId => userId !== req.session.user.id);
            await workshop.save();
            user.EnrolledWorkshops = user.EnrolledWorkshops.filter(workshopId => workshopId !== workshopID);
            await user.save();
            res.status(200).json(workshop);
        }
    
    } catch (error) {
        res.status(500).send('Error updating workshop');
    }
}

// Renders profile page by redirecting to get request for user page with user's own ID
app.get("/profile", checkLoggedIn, sendProfile);
async function sendProfile(req, res) { 
    res.redirect(`/users/${req.session.user.id}`);    
}

// Renders page with all the user's liked artworks
app.get("/liked", checkLoggedIn, async (req, res) => {

    const user = await User.findById(req.session.user.id);
    const likedArtworkIds = user.Liked;

    const artworks = await Artwork.find({ _id: { $in: likedArtworkIds } });
    let obj = {liked: true};
    // Render "likeOrRev" page first, then add on the list of artworks
    res.render("likeOrRev", {obj: obj}, (err, likedPage) => {
        res.render("artworksList", { artworks }, (err, artworksList) => {
            res.send(likedPage + artworksList);
        });
    });
});

// Renders page with all the user's reviewed artworks
app.get("/reviewed", checkLoggedIn, async (req, res) => {

    const user = await User.findById(req.session.user.id);
    const reviewedArtworkIds = user.Reviewed;

    const artworks = await Artwork.find({ _id: { $in: reviewedArtworkIds } });
    let obj = {reviewed: true};
    // Render "likeOrRev" page first, then add on the list of artworks
    res.render("likeOrRev", {obj: obj}, (err, reviewedPage) => {
        res.render("artworksList", { artworks }, (err, artworksList) => {
            res.send(reviewedPage + artworksList);
        });
    });
});

// Invalid request was made
app.use((req, res) => {
    res.status(404).send("Unknown resource");
});

app.listen(3000);
console.log("Server listening at http://localhost:3000");

