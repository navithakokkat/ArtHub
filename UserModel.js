const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let userSchema = Schema({
    Username:{
        type: String,
        required: true
    }, 
    Password:{
        type: String,
        required: true
    }, 
    Following: {
        type: Array,
        default: []          
    },
    Reviewed:{
        type: Array,
        default: []         
    }, 
    Liked:{
        type: Array,
        default: []         
    }, 
    Notifications:{
        type: Array,
        default: []         
    }, 
    EnrolledWorkshops: {
        type: Array,
        default: []         
    },
    Role:{
        type: String,
        default: "patron"   
    }, 
    Followers: {
        type: Array,
        default: []         
    },
    Workshops: {
        type: Array,
        default: []         
    },
    Artworks:{
        type: Array,
        default: []         
    },
}); 

module.exports = mongoose.model("User", userSchema);