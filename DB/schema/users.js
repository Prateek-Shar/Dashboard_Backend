import mongoose from "mongoose";
import AutoIncrementFactory from 'mongoose-sequence';   

const connection = mongoose.connection;
const AutoIncrement = AutoIncrementFactory(connection);

const userSchema = new mongoose.Schema({
    UID : {type : Number},
    Username: { type : String, required: true},
    Email: { type : String, required: true },
    Password: { type : String, required: true },
    Profession: { type : String, required: true },  
    CreatedAt: { type : String}
})

userSchema.plugin(AutoIncrement, { inc_field: 'UID' });


const User = mongoose.model("User", userSchema);


export default User;