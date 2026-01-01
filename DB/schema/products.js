import mongoose, { Mongoose } from "mongoose";

const productSchema = new mongoose.Schema({
    UID : {type : Number , required : true},
    P_id : {type : Number },
    Product_name : {type : String},
    Product_price : {type : Number},
    Product_catagory : {type : String},
    Product_quantity : {type : Number},
    Discount : {type : Number}
})

const Product = mongoose.model("product" , productSchema)

export default Product;