import Connect from "./Connect/db.js"
import express, { json } from "express"
import Customer from "../DB/schema/customers.js"
import Product from "./schema/products.js"
import Income from "./schema/income.js"
import User from "./schema/users.js"
// import user_info from "./schema/redis_info.js"
import redis_connect from "../MiddleWare/redis_connect.js"
import Task from "./schema/task.js"
import { client } from "../MiddleWare/redis_connect.js"
import cors from "cors"
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import getSessionInfo from "../MiddleWare/auth.js"
import Session from "./schema/session.js"
import { v6 as uuidv6 } from "uuid"
import crypto from "crypto"


const app = express()

// Cors 
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://insightboard.vercel.app",
]

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use((req , res , next) => {
  console.info(`Request Receved - Method : ${req.method} , URL : ${req.originalUrl}`)
  // console.info(`Origin : ${req.headers.origin}`)  
  next()
})


const PORT = process.env.PORT || 8080;

app.use(express.json());  
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser());




// Server Starts
app.listen(PORT , async() => {

  try {
    await Connect();
    await redis_connect()
    // console.log(`Server is running on : http://localhost:${PORT}`)
  }

  catch(error) {
    console.log(`Failed to start the server : ${error}`)
  }

})


app.post("/dummydata" , async(req , res) => {
  const dummy = [
      {
        Project_name: "Recipe Tales",
        Task_id: "TASK-001",
        Task_desc: "Design the recipe listing page",
        Task_status: "COMPLETED",
        Progress: 100,
        Start_date: "2026-08-01",
        End_date: "2026-08-05",
        Duration: 4
    },
    {
        Project_name: "Recipe Tales",
        Task_id: "TASK-002",
        Task_desc: "Implement recipe search functionality",
        Task_status: "IN_PROGRESS",
        Progress: 65,
        Start_date: "2026-08-05",
        End_date: "2026-08-15",
        Duration: 10
    },
    {
        Project_name: "Recipe Tales",
        Task_id: "TASK-003",
        Task_desc: "Build recipe rating system",
        Task_status: "IN_PROGRESS",
        Progress: 40,
        Start_date: "2026-08-10",
        End_date: "2026-08-20",
        Duration: 10
    },
  ]

  try {
    const response = await Task.insertMany(dummy)

    if(!response) {
      return res.status(401).json({"message" : "Data not sent to DB"})
    }

    return res.status(200).json({"message" : "Data sent to db"})
  }

  catch(error) {
    console.error("Error from Backend : " , error)
  }


})

// Delete Account 
app.delete("/deleteAcc" , async(req , res) => {
  
  try {

    // console.log("Getting session id from console")
    const session_id = req.cookies.SessionID

    // console.log("Getting details from redis")
    const raw_uid = await client.get(session_id)

    // console.log("Parsing UID")
    const UID = JSON.parse(raw_uid).UID

    if(!UID) {
      return res.status(401).json({msg : "UID Not Found"})
    }

    const deleteTask = await Task.deleteMany({"UID" : UID})
    const deleteCustomer = await Customer.deleteMany({"UID" : UID})
    const deleteProducts = await Product.deleteMany({"UID" : UID})
    const deleteIncome = await Income.deleteMany({"UID" : UID})

    const deleteUser = await User.deleteOne({"UID" : UID})

    const deleteCookie = res.clearCookie("SessionID" , {
      secure : true,
      httpOnly : true,
      sameSite : "none",
      path : "/"
    })
    
    const deleteSession = await client.del(session_id)

    if(deleteSession == 0) {
      return res.status(401).json({msg : "Unable to Delete Session"})
    }

    if (!deleteTask || !deleteIncome || !deleteCustomer || !deleteProducts || !deleteUser) {
      return res.status(404).json({msg : "Unable to perform the operations"})
    }

    if (!deleteSession) {
      return res.status(401).json({msg : "Not able to delete session"})
    }

    return res.status(200).json({msg : "User Deleted Successfully"})
  }

  catch(err) {
    console.log("Error from backend : " , err)
    return res.status(500).json({error : err})
  }

})

// Reset Route
app.get("/verify_user" , async(req , res) => {

  try {
    const { search } = req.query;

    console.log("Query : " , req.query)

    if(!search) {
      return res.status(404).json({msg : "Missing Fields"})
    }

    const user = await User.findOne({"Username" : search})

    if(!user) {
      return res.status(404).json({msg : "User Not Found"})
    }

    return res.status(200).json({msg : "Success"})
  }

  catch(err) {
    console.error("Error from backend : " , err)
  }
})


app.put("/changePass" , async(req , res) => {
  const { search } = req.query
  const { Password , Confirm_password } = req.body

  const encrypted_pass = crypto.createHash("sha256").update(Password).digest("base64")
  const encrypted_confirm_pass = crypto.createHash("sha256").update(Confirm_password).digest("base64") 

  try {
   

    if(!search) {
      return res.status(401).json({err : "Didn't recieve query"})
    }

    if(!Password || !Confirm_password) {
      return res.status(401).json({msg : "Missing Fields"})
    }

    if(encrypted_pass != encrypted_confirm_pass) {
      return res.status(401).json({msg : "Passwords do not match"})
    }

    const data = await User.findOneAndUpdate({"Username" : search} , {$set : {"Password" : encrypted_pass}} , {new : true})

    if(!data) {
      return res.status(401).json({result : "Not able to update pass"})
    }

    return res.status(200).json({result : "Password Changed"})
  } 

  catch(err) {
    console.error("Error from backend : " , err)
  }
})




// Task route
app.get("/task_details" , getSessionInfo , async(req, res) => {

  const sessionID = req.cookies.SessionID;

  const data = await client.get(sessionID)
  let parsed_data = JSON.parse(data)

  const UID = parsed_data.UID;
  // console.log("UID : " , UID)

  if(!UID) {
    return res.status(401).json({msg : "UID not available"})
  }

  try {
    const det = await Task.find({UID}).select("-Start_date -Project_name -__v")
    // console.info("Response from db : " , det)

    if(!det) {
      return res.status(401).json({"message" : "Data not recieved from db"})
    }

    return res.status(200).json({"message" : "Data recieved" , result : det})
  }

  catch(error) {
    console.error("Error from backkend : " , error)
  }
})


app.get("/get_task_info/:id" , async(req , res) => {
  try {
    const {id} = req.params
    console.log("ID : " , id)
    console.log("Request from frontend : " , req.body)

    if(!id) {
      return res.status(401).json({"message" : "ID is required"}) 
    }

    const task = await Task.findOne({"Task_id" : id}).select("-_id -__v -Start_date -End_date -Task_id")

    if(!task) {
      return res.status(401).json({"message" : "Task not found"})
    }

    return res.status(200).json({"message" : "Task info" , result : task})
  }
  catch(error) {
    console.error("Error from backend : " , error)
  }
})


app.get("/getTaskStats" , getSessionInfo , async(req , res) => {

  const sessionID = req.cookies.SessionID;

  const data = await client.get(sessionID)
  const parsed_data = JSON.parse(data)

  const UID = parsed_data.UID;

  console.log("Session ID:", sessionID);
  console.log("Redis data:", req.sessionInfo);

  console.log("UID : " , UID)

  if(!UID) {
    return res.status(404).json({msg : "UID not available"})
  }

  try {
    const Completed_count = await Task.countDocuments({"Task_status" : "Completed" , "UID" : UID})
    const Tracked_count = await Task.countDocuments({"UID" : UID})

    console.log("Completed count : " , Completed_count)
    console.log("Tracked count : " , Tracked_count)

    // if(!Completed_count && !Tracked_count) {
    //   return res.status(404).json({msg : "Not able to fetch data from db" })
    // }

    return res.status(200).json({Completed_count : Completed_count ,Tracked_count : Tracked_count})
  }

  catch(error) {
    console.error("Error from backend : " , error)
    return res.status(500).json({err : error})
  }
})


app.put("/edit_task" , async(req , res) => {
  try {
    const {id} = req.query
    const form = req.body   
    
    console.log("ID : " , id)
    console.log("Form : " , form)

    if(!id) {
      return res.status(401).json({"message" : "ID is required"})
    }

    const task = await Task.findOneAndUpdate({"Task_id" : id}, form, {new : true})
    console.log("Task : " , task)
    return res.status(200).json({"message" : "Task modified" , result : task})
  }
  catch(error) {
    console.error("Error from backend : " , error)
  }
})


app.post("/newTask" , getSessionInfo , async (req , res) => {

  const { Project_name , Task_desc , Task_status , End , Progress , Start , Task_id } = req.body

  // console.log(req.body)  
  const session_id = req.cookies.SessionID;

  const data = await client.get(session_id);
  const UID = JSON.parse(data).UID

  // console.log("UID : " , UID)

  if(!UID) {
    return res.status(401).json({msg : "UID not found"})
  }

  const format_start_date = new Date(Start)
  format_start_date.toISOString()

  // console.log(format_start_date);

  const curr_date = new Date();
  const end = new Date(curr_date);
  end.setDate(curr_date.getDate() + 10);

  const formatted_end_date = end.toISOString()

  const u_id = uuidv6()

  if(!Project_name || !Task_desc || !Task_status || !Progress) {
    return res.status(401).json({msg : "Missing Fields"})
  }
  
  const detail = Task.create({
    "UID" : UID,
    "Project_name" : Project_name,
    "Task_desc" : Task_desc,
    "Task_status" : Task_status,
    "Progress" : Progress,
    "End_date" : formatted_end_date, 
    "Task_id" : u_id,
    "Start_date" : Start
  })

  if(!detail) {
    return res.status(401).json({"error" : "Something went wrong while inserting data to db"})
  }

  return res.status(200).json({"msg" : "Data Stored Successfully"})

})


app.get("/getDataForChart" , async(req , res) => {

  const {start , end} = req.query;

  const toDate = new Date(end)
  const fromDate = new Date(start)

  console.log("From : " , fromDate)
  console.log("To : " , toDate)

  if(!start || !end) {
    return res.status(404).json({msg : "Dates not recieved"})
  }

  const da = Task.find({"Start_date" : {$gte : fromDate , $lte : toDate}}) 
  console.log(da)
})



// Signup Routes -
app.post("/newUser", async (req, res) => {

  const { Username, Email, Password, Profession , First_name , Last_name } = req.body;

  console.log("Password : " , Password)

  try {

    if (!Username || !Email || !Password || !Profession || !First_name || !Last_name) {
      return res.status(400).json({err_msg : "Missing Fields"})
    }

    const existing_user = await User.find({ Username });

    if (existing_user.length > 0) {
      return res.status(400).json({
        err_msg: "Same User Found. Try creating acc. with different username"
      });
    }


    const users = await User.find().sort({"UID" : 1}).select("UID");
    let UID = 1;  

    for (let user of users) {
      if (user.UID !== UID) break; 
      UID++;
    }

    const pass = crypto.createHash("sha256").update(Password).digest("base64")

    const newUser = await User.create({
      "UID" : UID ,
      "Username" : Username,
      "Email" : Email,
      "Password" : pass,
      "Profession" : Profession,
      "First_name" : First_name,
      "Last_name" : Last_name,
      "Date_created" : new Date()
    });

    return res.status(201).json({ user: newUser , login_success : "User created successfully"});

  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }

});


app.get("/getUserLength" , async(req , res) => {

  try {
    return res.status(200).json({UserCount : NumberOfUsers})
  }

  catch(error) {
    return res.json(401).json({error: "Error : " , error})
  }

})



// Login Routes
app.post("/UserCheck" , async (req , res) => {

  const SessionID = uuidv4();

  try {

    console.log("1. Recieved data from frontend")
    if (!req.body.Username || !req.body.Password) {
      return res.status(400).json({ msg: "Missing Fields" });
    }

    console.log("2. Before User.findOne()");

    const hashed_pass = crypto.createHash("sha256").update(req.body.Password).digest("base64")

    const userDoc = await User.findOne({ "Username" : req.body.Username, "Password" : hashed_pass});

    if (!userDoc) {
      return res.status(404).json({ msg: "Invalid Username or Password" });
    }

    console.log("3. Settng the session id to redis db")
    await client.set(SessionID , JSON.stringify({"UID" : userDoc.UID , "Username" : userDoc.Username , "First_name" : userDoc.First_name , "Last_name" : userDoc.Last_name}) , {EX : 60 * 10})

    await Session.create({
      // UID: userDoc.UID,
      SessionID: SessionID,
    });

    console.log("Sessiion id : " , SessionID)

    console.log("5. Setting Cookie")
    res.cookie("SessionID", SessionID, {
      maxAge: 10 * 60 * 1000,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });

    console.log("Login Successfull")

    return res.status(200).json({
      message: "Login successful"
      // login_det: {
      //   Username: userDoc.Username,
      //   Profession: userDoc.Profession,
      //   UID: userDoc.UID,
      // },
    });

  } 
  
  catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json({ err : error });
  }

});


  app.get("/getInfo" , getSessionInfo , async(req , res) => {

    const sessionID = req.sessionInfo;
    // console.log("SessionID : " , sessionID)

    const check = await client.get(sessionID)

    if(!check) {
      return res.status(401).json({"message" : "No SessionID found in redis db"})
    }

    return res.status(200).json({"message" : "SessionID found"})
  })



app.get("/getUserInfo" , async (req, res) => {

  const sessionId = req.cookies.SessionID;

  try {
    const session = await client.get(sessionId);
    // console.log("Session data : " , session)

    if (!session) {
      console.error("No Session ID found in Redis DB")
      return res.status(401).json({ error: "Invalid or expired session" });
    }
  
    // const user = await client.get(sessionId);
    // console.log("Data from redis db : " , session);
    const user = JSON.parse(session);

    // if (!user) {
    //   return res.status(404).json({ error: "User not found" });
    // }

    return res.status(200).json({ login_det: user });

  } 
  
  catch (err) {
    console.error("Error validating session:", err);
    return res.status(500).json({ error: "Server error" });
  }

});



app.get("/aliveRoute" , async(req , res) => {

  const SessionID = req.cookies.SessionID;

  if (!SessionID) {
    return res.status(401).json({message : "Un-authorized access , No Session ID"})
  }

  return res.status(200).json({message : "Session Exists , Route is Alive"})

})


// Product Routes - 
app.get("/get_products" , getSessionInfo , async(req , res) => {

  const UID = req.user;

  try { 
    const response = await Product.find({ UID }).select("-_id -__v");
    res.status(200).json({product_det : response })
  }

 catch(error) {
  console.log("Error : " , error);
  res.status(500).json({ message: "Internal Server Error" });
  }
})


app.get("/get_products_length" , getSessionInfo , async(req , res) => {

  const UID = Number(req.userID);
  
  try {
    const response = await Product.countDocuments({"UID" : UID })

    res.status(200).json({products_info : response})
  }

  catch(error) {
    res.status(500).json({error : "Something Broke Up"})
  }

})



app.get("/product_stats" ,  getSessionInfo , async(req , res) => {

  const sessionID = req.sessionInfo;
  // console.log(sessionID)

  const data = await client.get(sessionID)
  const parsed_data = JSON.parse(data)

  const UID = parsed_data.UID

  try {
    const InStock = await Product.countDocuments({"Product_quantity" : {$gt : 2} , UID})
    const outOfStockInNumbers = await Product.countDocuments({"Product_quantity" : {$lte : 0} , UID})
    const LowOnStock = await Product.find({"Product_quantity" : {$gt : 0 , $lte : 2} , "UID" : UID}).select("-_id -UID -P_id -__v -Product_catagory")
    const ZeroStock = await Product.find({"Product_quantity" : {$eq : 0} , "UID" : UID}).select("-_id -UID -P_id -__v -Product_catagory")
    const response3 = await Product.countDocuments({UID})
    const response2 = await Product.countDocuments({"Product_quantity" : 3 , UID})

    res.status(200).json({product_stats1 : InStock, product_stats2 : response2 , product_stats3 : response3 , product_stats4 : ZeroStock , product_stats5 : LowOnStock , product_stats6 : outOfStockInNumbers})
  }

  catch(error) {
    console.log("Error : " , error) 
  }
})



app.post("/send_products", getSessionInfo , async (req, res) => {
  if (!req.body.Product_catagory || !req.body.Product_name || !req.body.Product_price || !req.body.P_id  || !req.body.Discount) {
    return res.status(400).json({error : "Fields Missing"});
  }

  const { Product_name, Product_catagory, Product_price, Product_quantity, P_id , Discount} = req.body;
  const UID = req.userID;


  try {
    const existingProduct = await Product.findOne({ Product_name, UID });

    if (existingProduct) {
      existingProduct.Product_quantity = (Number(existingProduct.Product_quantity) || 0) + Number(Product_quantity);
      await existingProduct.save();

      return res.status(200).json({
        message: "Product exists. Quantity updated.",
        updated_product: existingProduct,
      });
    }

    const newProduct = await Product.create({
      Product_name,
      Product_price,
      Product_catagory,
      Product_quantity,
      P_id,
      UID,
      Discount
    });

    res.status(200).json({ message: "New product created.", new_entry: newProduct });
  } catch (error) {
    console.error("Error while adding/updating product:", error);
    res.status(500).json({ message: "Server error. Could not process product." });
  }
});


app.get("/get_pid" , getSessionInfo , async(req ,res) => {

  const UID = Number(req.userID)

  const latest_product = await Product.findOne({"UID" : UID}).sort({"P_id" : -1}).select("P_id");

  const nextPID = latest_product ? latest_product.P_id + 1 : 1;

  return res.status(200).json({P_id : nextPID});

})



app.delete("/delete_product", async (req, res) => {
    try {
        const { P_id } = req.query;
        const result = await Product.deleteOne({ P_id: Number(P_id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting product", error });
    }
});


app.get("/get_product_statistics", getSessionInfo , async (req, res) => {
    const { page } = req.query;  // Correct way to get ?page=2
    const pageNumber = parseInt(page) || 1; // Default to 1 if undefined
    const pageSize = 5; // 5 items per page

    const skip = (pageNumber - 1) * pageSize;

    const sessionID = req.sessionInfo;

    const data = await client.get(sessionID)
    const parsed_data = JSON.parse(data)
  
    const UID = parsed_data.UID

    try {
        const response = await Product.find({ UID })
            .select("-_id -__v")
            .skip(skip)
            .limit(pageSize); // limit the data to pageSize

        res.status(200).json({ stats: response });
    } catch (error) {
        console.error("Error fetching product statistics:", error);
        res.status(500).json({ error: "Failed to fetch product statistics" });
    }
});






// Customer Routes -
app.get('/search_customer' , getSessionInfo , async (req, res) => {
    const { name } = req.query;
    const sessionID = req.sessionInfo;

    const data = await client.get(sessionID)
    const parsed_data = JSON.parse(data)

    const UID = parsed_data.UID


    try {
        const customer = await Customer.find({ Customer_name : name , UID : UID }).select("-Date_created -_id -UserID -__v"); // Case-sensitive Exact Match
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });  
    }
});


app.post("/send_customer", getSessionInfo , async (req, res) => {

  const UID = Number(req.userID); // Ensure UID is a number

  const { Customer_name, Company_name, Contact_no, Country, Email, Status, Created_at, CID , links , Industry } = req.body;

  // console.log("Request Body Starts")

  // console.log("Company name : " , req.body.Company_name);
  // console.log("Customer name : ", req.body.Customer_name);
  // console.log("CID : " , req.body.CID);
  // console.log("Status : " , req.body.Status);
  // console.log("Contact No : " , req.body.Contact_no)
  // console.log("Email : " , req.body.Email)
  // console.log("Country : " , req.body.Country)
  // console.log("Created : " , req.body.Created_at)


  // Validate after extracting
  if (!Customer_name || !Email || !Contact_no || !UID || !CID || !Company_name || !Country || !Status) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const result = await Customer.create({      
      UID,
      Customer_name,
      Company_name,
      Contact_no,
      Country,
      Email,
      Status,
      Created_at,
      CID,
      links,
      Industry
    });

    return res.status(200).json({ New_Entry: result });
    
    
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/get_customers" , getSessionInfo , async(req , res) => {
  const { page } = req.query;  // Correct way to get ?page=2
  const pageNumber = parseInt(page) || 1; // Default to 1 if undefined
  const pageSize = 5; // 5 items per page

  const skip = (pageNumber - 1) * pageSize;

  const sessionID = req.sessionInfo;

  const data = await client.get(sessionID)
  const parsed_data = JSON.parse(data)

  const UID = parsed_data.UID

  try {
      const response = await Customer.find({ "UID" : UID })
          .select("-_id -__v -UserID -Date_created")
          .skip(skip)
          .limit(pageSize); // limit the data to pageSize

      res.status(200).json({ customer_stats: response });
  } catch (error) {
      console.error("Error fetching product statistics:", error);
      res.status(500).json({ error: "Failed to fetch product statistics" });
  }
})


app.delete("/deleteCustomer" , getSessionInfo , async(req , res) => {

  const { email } = req.query;
  console.log("Email : " , email)

  const sessionID = req.sessionInfo;

  const data = await client.get(sessionID)
  const parsed_data = JSON.parse(data)

  const UID = parsed_data.UID
  console.log("UID : " , UID)

  if(!email) {
    return res.status(401).json({error : "Bad Request or invalid parameters"})
  }

  try {
    const response = await Customer.deleteOne({ "UID" : UID , "Email" : email})

    return res.status(200).json({response : "Data Deleted"})
  }

  catch(error) {
    return res.status(400).json({error : "Something broke on server side"})
  }
})



app.get("/getDataAccToFilter" , getSessionInfo , async(req ,res) => {
  const sessionID = req.sessionInfo;
  console.log("Session : " , sessionID)

  const data = await client.get(sessionID)
  const parsed_data = JSON.parse(data)

  const UID = parsed_data.UID

  const { value } = req.query;

  try {

    if(value == "Newest") {
      const response = await Customer.find({"UID" : UID}).sort({Created_at : 1}).select("-UID -_id -Created_at -__v")
      res.status(200).json({Details : response})
    }

    if(value == "Oldest") {
      const response = await Customer.find({"UID" : UID}).sort({Created_at : -1}).select("-UID -_id -Created_at -__v")
      res.status(200).json({Details : response})
    }

    if(value == "Active" || value == "Inactive") {
      const response = await Customer.find({"UID" : UID , "Status" : value}).select("-UID -_id -Created_at -__v")
      res.status(200).json({Details : response})
    }

  }

  catch(error) {
    console.error("Something Broke Up on Backend")
  }
})

 

app.get("/get_customer_stats" , getSessionInfo , async(req , res) => {

  const sessionID = req.sessionInfo;

  const data = await client.get(sessionID)
  const parsed_data = JSON.parse(data)

  const UID = parsed_data.UID

  const response1 = await Customer.countDocuments({"Status" : "Active" , UID})
  const response3 = await Customer.countDocuments({ "UID" : UID })
  const response2 = await Customer.countDocuments({ UID });

  const cid_number = response2 + 1;

  res.status(200).json({active_member : response1 , next_cid : cid_number , totalCustomers : response3 })

})



//Overview Routes 
app.get("/get_overview_stats" , getSessionInfo , async(req , res) => {

  // const sessionID = req.sessionInfo;
  const sessionID = req.cookies.SessionID;

  // console.log("SessionID : " , sessionID)
  const data = await client.get(sessionID); 

  if (!data) {
    return res.status(401).json({ msg: "Invalid or expired session" });
  }

  let parsed_data;
  try {
    parsed_data = JSON.parse(data);
  } catch {
    return res.status(500).json({ error: "Invalid session data" });
  }

  const UID = parsed_data?.UID;
  if (UID == null || UID === "") {
    return res.status(401).json({ msg: "UID unavailable" });
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 1);

  try {
    const newCustomer = await Customer.countDocuments({UID : UID , Created_at : {$gt : startDate , $lt : endDate}})
    const totalCustomer = await Customer.countDocuments({UID})
    const TotalStockCount = await Product.countDocuments({UID})

    const totalIncomeAgg = await Income.aggregate([
      { $match: { UID } },
      { $group: { _id: null, total: { $sum: "$Amount" } } },
    ]);
    const totalIncome = totalIncomeAgg[0]?.total || 0;

    res.status(200).json({StockCount : TotalStockCount  , Total_Income: totalIncome , Total_Customer : totalCustomer , NewCustomerCount : newCustomer})

  }

  catch(error) {
    res.status(400).json({error : "Something broke on server side"}) 
  }

})  

app.get("/get_line_chart_info" , getSessionInfo , async(req , res) => {

  const sessionID = req.sessionInfo;

  const data = await client.get(sessionID)
  const parsed_data = JSON.parse(data)

  const UID = parsed_data.UID

  const result = await Income.aggregate([
    {
      $match: {
        UID: UID,
      }
    },
    {
      $group: {
        _id: "$Catagory",
        total: { $sum: "$Amount" }
      }
    }
  ]);

  res.status(200).json({ Details: result })

})



app.get("/getDataForPie" , getSessionInfo , async(req , res) => {

  const sessionID = req.cookies.SessionID;

  const data = await client.get(sessionID)
  const parsed_data = JSON.parse(data)

  const UID = parsed_data.UID

  const endDate = new Date(); // now
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30); // 31 days ago

  const result = await Customer.aggregate([
    {
      $match: {
        UID: UID,
        Created_at: { $gte: startDate, $lte: endDate } // last 30 days
      }
    },
    {
      $group: {
        _id: "$Country",
        total: { "$sum" : 1 }
      }
    }
  ]);

  res.status(200).json({ Details: result })
})


app.get("/getLatestTransaction" , getSessionInfo , async(req , res) => {

  const sessionID = req.sessionInfo;

  const data = await client.get(sessionID)
  const parsed_data = JSON.parse(data)

  const UID = parsed_data.UID

  try {
    const result = await Income.find({"UID" : UID}).select("-_id -UID -__v").sort({"Created_at" : -1}).limit(3)

    res.status(200).json({detail : result})
  }

  catch(error) {
    return res.status(400).json({error : "Something wrong with API"})
  }

})


app.get("/get_low_stock_info" , getSessionInfo , async(req , res) => {

  const sessionID = req.cookies.SessionID;

  const data = await client.get(sessionID)
  const parsed_data = JSON.parse(data)

  const UID = parsed_data.UID

  const result = await Product.find({"Product_quantity" : {$lt : 5} , "UID" : UID}).select("-UID -P_id -Product_price -Product_catagory")

  res.status(200).json({details : result})

})




// Income Routes -
app.post("/send_income" , getSessionInfo ,  async(req , res) => {
  const sessionID = req.sessionInfo;

  const data = await client.get(sessionID)
  const parsed_data = JSON.parse(data)

  const UID = parsed_data.UID

  const { Source , Amount , Catagory , Created_at } = req.body

  try {
    const IncomeEntry = await Income.create({Created_at , Source , Amount , Catagory , UID})
    res.status(200).json({message : "Income Inserted Succesfully"})
  }

  catch(error) {
    console.log(error)
  }
})


app.get("/get_income_detail" , getSessionInfo , async(req , res) => {
  const { page } = req.query;  // Correct way to get ?page=2
  const pageNumber = parseInt(page) || 1; // Default to 1 if undefined
  const pageSize = 5; // 5 items per page

  const skip = (pageNumber - 1) * pageSize;

  const sessionID = req.cookies.SessionID;

  const data = await client.get(sessionID)
  const parsed_data = JSON.parse(data)

  const UID = parsed_data.UID

  try {
      const response = await Income.find({UID})
        .select("-_id -__v -UserID -Date_created")
        .skip(skip)
        .limit(pageSize); // limit the data to pageSize

      res.status(200).json({ Income_stats: response });
  } catch (error) {
      console.error("Error fetching product statistics:", error);
      res.status(500).json({ error: "Failed to fetch product statistics" });
  }
})


app.get("/get_income_length" , getSessionInfo , async(req ,res) => {

  try {
    const sessionID = req.sessionInfo;

    const data = await client.get(sessionID)
    const parsed_data = JSON.parse(data)

    const UID = parsed_data.UID


    const incomelen = await Income.countDocuments({"UID" : UID})
    res.status(200).json({Income_stats : incomelen})
  }

  catch(error) {
    res.status(401).json({error : "Something broke on server side"})
  }
})


app.get("/get_data_by_month", getSessionInfo, async (req, res) => {
  const sessionID = req.sessionInfo;

  const data = await client.get(sessionID)
  const parsed_data = JSON.parse(data)

  const UID = parsed_data.UID


  // Start of current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Start of next month
  const startOfNextMonth = new Date(startOfMonth);
  startOfNextMonth.setMonth(startOfMonth.getMonth() + 1);

  try {
    const response = await Income.aggregate([
      {
        $match: {
          UID : UID, 
          Created_at: { $gte: startOfMonth, $lte: startOfNextMonth }
        }
      },
      {
        $group: {
          _id: "$Catagory",
          amt: { $sum: "$Amount" }
        }
      }
    ]);

    res.status(200).json({ detail: response });
  } catch (error) {
    console.error("Error fetching monthly data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



app.get("/get_data_daily", getSessionInfo, async (req, res) => {
  const sessionID = req.sessionInfo;

  const data = await client.get(sessionID)
  const parsed_data = JSON.parse(data)

  const UID = parsed_data.UID

  // Get start of today
  const start = new Date();
  start.setHours(0, 0, 0, 0)

  // Get end of today
  const end = new Date();
  end.setHours(23, 59, 59, 999)

  try {
    const response = await Income.aggregate([
      {
        $match : {  
          UID : UID ,
          Created_at : { $gte : start , $lte : end }
        }
      } ,

      {
        $group : {
          _id : "$Catagory",
          amt : { $sum : "$Amount"}
        }
      }

    ])

    res.status(200).json({ detail: response });
  
  } catch (error) {
    console.error("Error fetching daily data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




app.get("/get_data_by_year", getSessionInfo, async (req, res) => {
  const sessionID = req.sessionInfo;

  const data = await client.get(sessionID)
  const parsed_data = JSON.parse(data)

  const UID = parsed_data.UID


  const currentDate = new Date();

  // Start date = 12 months before current month
  const start = new Date(currentDate);
  start.setMonth(currentDate.getMonth() - 12);

  // End date = 12 months after current month
  const end = new Date(currentDate);
  end.setMonth(currentDate.getMonth());

  try {
    const response = await Income.aggregate([
      {
        $match: {
          UID : UID, 
          Created_at: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id : "$Catagory",
          amt: { $sum: "$Amount" }
        }
      }
    ]);

    res.status(200).json({ detail: response });
  } catch (error) {
    console.error("Error fetching monthly data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



app.get("/getIncomeStats", getSessionInfo, async (req, res) => {
  const sessionID = req.sessionInfo;

  const data = await client.get(sessionID)
  const parsed_data = JSON.parse(data)

  const UID = parsed_data.UID


  try {
    const now = new Date();

    // ----------- TOTAL TRANSACTIONS -----------
    const totalTransactions = await Income.countDocuments({ UID });

    // ----------- TOTAL INCOME -----------
    const totalIncomeAgg = await Income.aggregate([
      { $match: { UID } },
      { $group: { _id: null, total: { $sum: "$Amount" } } },
    ]);
    const totalIncome = totalIncomeAgg[0]?.total || 0;

    // ----------- MONTHLY GROWTH -----------
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = startOfCurrentMonth;

    // Current Month
    const currentMonthIncomeAgg = await Income.aggregate([
      {
        $match: {
          UID,
          Created_at: { $gte: startOfCurrentMonth, $lt: endOfCurrentMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$Amount" } } },
    ]);
    const currentIncome = currentMonthIncomeAgg[0]?.total || 0;

    // Previous Month
    const previousMonthIncomeAgg = await Income.aggregate([
      {
        $match: {
          UID,
          Created_at: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$Amount" } } },
    ]);
    const previousIncome = previousMonthIncomeAgg[0]?.total || 0;

    // Growth %
    let growth = 0;
    if (previousIncome !== 0) {
      growth = ((currentIncome - previousIncome) / previousIncome) * 100;
    } else if (currentIncome > 0) {
      growth = 100;
    }

    // ----------- TOP CATEGORY -----------
    const topCategoryAgg = await Income.aggregate([
      { $match: { UID } },
      {
        $group: {
          _id: "$Catagory",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);
    const topCategory = topCategoryAgg[0]?._id || "N/A";

    // ----------- FINAL RESPONSE -----------
    res.status(200).json({
      Total_Income: totalIncome,
      Monthly_Growth: `${growth.toFixed(2)}%`,
      Total_Transaction: totalTransactions,
      Top_Category: topCategory,
    });
  } catch (error) {
    console.error("Error getting income stats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



// Logout Route -
app.get("/logout", async(req, res) => {

  const sessionID = req.cookies.SessionID;

  if(!sessionID) {
    return res.status(401).json({msg : "SessionID not found"})
  }

  await client.del(sessionID);

  res.clearCookie("SessionID", {
    secure: true,
    sameSite: "none",
  });

  return res.status(200).json({ message: "Logged out" });

});




// Extra Route -
app.get("/edit_product" , async(req , res) => {
  const { keyno } = req.query;

  const response = await Product.find({ "P_id" : keyno}).select("-_id -__v")
  res.status(200).json({edit_product : response})
  res.sendFile(__dirname , "../Pages" , "NewProduct.tsx")
})