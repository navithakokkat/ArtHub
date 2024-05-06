# ArtHub

### Installation, Initialization, and Running Instructions
1. Use the command `npm install` in the terminal in this project’s directory to install the
dependencies needed.
2. Make sure that MongoDB is running on your device. If it is not installed as a service, you
will have to go to a new terminal and type `mongod` to get it started, assuming you have
installed mongo already.
3. Initialize the database by using the command `node gallery-generator.js` and wait until
no text is being printed. Then, press the keys Ctrl + C to stop.
4. Run the server by using the command `node server.js`. A message will be printed out
with a link to go to in order to access the website.
5. Either click on the link or open a browser and manually type in that link.
6. To stop the server once you are done, in the terminal press the keys Ctrl + C.


### List of Files
+ styles.css
    - This file contains code to format and style elements on the web pages.
+ gallery.json
    - This file contains the artwork objects that the database will be initialized with.
+ client.js
    - This file contains the client-side code for the functionality of the program for each individual user that is interacting with the website on separate browsers.
+ addArtwork.pug
    - This file provides a form for users to enter their artwork information and upload it.
+ addWorkshop.pug
    - This file provides a form for users to enter their workshop information and add it.
+ artwork.pug
    - This file displays a specific artwork and its information. Users can add and remove likes and reviews to each artwork that is not their own.
+ artworkSearch.pug
    - This file displays a page that allows the user to filter through all the artworks on the database by its title, artist, category, and medium. The resulting artworks that match the filter will be shown in the empty “results” div.
+ artworksList.pug
    - This file displays all artwork titles and images that are in the list of artworks that are passed in. This is used to add the resulting artworks that match the filter to both the “results” div of the artworkSearch.pug file, and the “likedArtworksContainer” of the likeOrRev.pug file.
+ home.pug
    - This displays the login/registration page for the program. Users can enter a username and password and login or register.
+ likeOrRev.pug
    - This page displays the list of artworks that have been liked or reviewed by the current user. The resulting artworks will be shown in the empty “likedArtworksContainer” div.
+ user.pug
    - This file displays a specific user page with their information. Users can follow and unfollow users except for themselves. If viewing their own profile, users can see their followers, who they are following, workshops they are enrolled in, notifications, and can also switch between “patron” and “artist” accounts.
+ user.pug
    - This file displays a specific workshop page with its information, including the host and a list of enrolled users. If the workshop is not the user’s own workshop, they can enroll/unenroll.
+ header.pug
    - This file contains the header for each web page.
+ ArtworkModel.js
    - This file contains the schema for artwork documents and defines its keys.
+ gallery-generator.js
    - Initializes the database by deleting all previous database information and using the gallery.json file to add artworks and their artists to the database.
+ package-lock.json
    - This file ensures that dependency versions are consistent when installing the project on different machines.
+ package.json
    - This file contains metadata about this project, including dependencies.
+ server.js
    - This file contains the server-side code for the functionality of the program.
+ UserModel.js
    - This file contains the schema for user documents and defines its keys.
+ WorkshopModel.js
    - This file contains the schema for workshop documents and defines its keys.
