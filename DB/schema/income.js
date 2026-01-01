import mongoose from "mongoose"

const incomeSchema = new mongoose.Schema({
    UID : {type : Number , required : true},
    Created_at : {type : Date , required : true},
    Source : {type : String , required : true},
    Amount : {type : Number , required : true},
    Catagory : {type : String , required : true},
    // Dated : {type : Date , required : true}
})

const Income = mongoose.model("Income" , incomeSchema)

export default Income;