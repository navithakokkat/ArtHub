const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let artworkSchema = Schema({
    Title:{
        type: String,
        required: true
    }, 
    Artist: {
        type: String,
        required: true
    }, 
    Year:{
        type: String,
        required: true
    },
    Category:{
        type: String,
        required: true
    },
    Medium:{
        type: String,
        required: true
    }, 
    Description:{
        type: String,
    }, 
    Poster:{
        type: String,
        required: true
    },
    Likes:{
        type: Number,
        default: 0
    },
    Reviews:{
        type: Array,
        default: []
    }

}); 

module.exports = mongoose.model("Artwork", artworkSchema);