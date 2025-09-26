import mongoose from "mongoose";

const connection = mongoose.connection;

const userSchema = new mongoose.Schema({
    UID : {type : Number},
    Username: { type : String, required: true},
    Email: { type : String, required: true },
    Password: { type : String, required: true },
    Profession: { type : String, required: true },  
    CreatedAt: { type : String}
})


const User = mongoose.model("User", userSchema);


export default User;