import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    UID : { type : Number , required : true },
    Username: { type : String, required: true},
    Email: { type : String, required: true },
    Password: { type : String, required: true },
    Profession: { type : String, required: true },  
    CreatedAt: { type : String}
})


const User = mongoose.model("User", userSchema);


export default User;