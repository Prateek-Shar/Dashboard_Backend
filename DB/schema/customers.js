import mongoose from "mongoose"; 

const customerSchema = new mongoose.Schema({
  UID: { type: Number, required: true },
  CID : {type: Number , required: true},
  Customer_name: { type: String, required: true },
  Company_name: { type: String, required: true },
  Contact_no: { type: String, required: true },
  Email: { type: String, required: true },
  Country: { type: String, required: true },
  Status: { type: String, required: true, enum: ["Active", "Inactive"] },
  Created_at: { type: Date, default: Date.now },
  links: { type : String },
  Industry : { type : String }
});

const Customer = mongoose.model("customers", customerSchema);


export default Customer;
