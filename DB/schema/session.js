import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    UID : {type : Number , required : true},
    SessionID : { type : String , required : true}
})

const Session = mongoose.model("session" , sessionSchema)

export default Session;