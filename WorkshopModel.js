const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let workshopSchema = Schema({
    Title:{
        type: String,
        required: true
    },
    EnrolledUsers: {
        type: Array,
        default: []         
    },
    Host:{
        type: String,
        required: true      
    }
}); 

module.exports = mongoose.model("Workshop", workshopSchema);