const mongoose = require("mongoose");
const Artwork = require("./ArtworkModel");
const User = require("./UserModel");
const Workshop = require("./WorkshopModel");
const fs = require("fs");

let artworkList = [];

// Deletes existing database information
async function deleteAll() {

  const artworks = await Artwork.find({});
  const users = await User.find({});
  const workshops = await Workshop.find({});

  artworks.forEach(artwork => {
    delete artwork.Title;
    delete artwork.Artist;
    delete artwork.Year;
    delete artwork.Category;
    delete artwork.Medium;
    delete artwork.Description;
    delete artwork.Poster;
    delete artwork.Likes;
    delete artwork.Reviews;
  });

  users.forEach(user => {
    delete user.Username;
    delete user.Password;
    delete user.Following;
    delete user.Reviewed;
    delete user.Liked;
    delete user.Notifications;
    delete user.EnrolledWorkshops;
    delete user.Role;
    delete user.Followers;
    delete user.Workshops;
    delete user.Artworks;
  });

  workshops.forEach(workshop => {
    delete workshop.Title;
    delete workshop.EnrolledUsers;
    delete workshop.Host;
  });
}

// Initializes the database
async function initializeDatabase() {
  try {
    await mongoose.connect('mongodb://127.0.0.1/finalproject', { useNewUrlParser: true, useUnifiedTopology: true });
    let db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));

    // Clearing contents of Artwork, User, and Workshop collections
    await deleteAll();
    await Artwork.deleteMany({});
    await User.deleteMany({});
    await Workshop.deleteMany({});

    // Dropping database
    await mongoose.connection.dropDatabase();

    fs.readdir("./public/gallery", async function (err, files) {
      if (err) throw err;

      let gallery = require("./public/gallery/" + files[0]);

      // Store all artworks in a list
      for (let i = 0; i < gallery.length; i++) {
        let a = new Artwork();
        a.Title = gallery[i]["Title"];
        a.Artist = gallery[i]["Artist"];
        a.Year = gallery[i]["Year"];
        a.Category = gallery[i]["Category"];
        a.Medium = gallery[i]["Medium"];
        a.Description = gallery[i]["Description"];
        a.Poster = gallery[i]["Poster"];
        artworkList.push(a);
      }

      // Save artworks
      await Promise.all(artworkList.map(art => art.save()));

      // Loop through artworkList to save all artists
      for (const artwork of artworkList) {
        // Checks if artist already exists, prevents duplicates
        const existingArtist = await User.findOne({ Username: artwork.Artist });

        if (existingArtist) {
          // Update existing artist's Artworks array
          existingArtist.Artworks.push(artwork.Title);
          await existingArtist.save();
          console.log(`Artwork "${artwork.Title}" associated with artist "${artwork.Artist}".`);
        } else {
          // Create a new user for the artist if not found
          const newArtist = new User({
            Username: artwork.Artist,
            Password: "123",
            Role: 'artist',
            Artworks: [artwork.Title],
          });
          await newArtist.save();
          console.log(`New artist "${artwork.Artist}" created and associated with artwork "${artwork.Title}".`);
        }
      }

    });

  } catch (error) {
    console.error(error);
  }
}

// Call the main function
initializeDatabase();
