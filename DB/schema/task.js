import mongoose from "mongoose"

const Task_schema = new mongoose.Schema({
    Project_name : {type : String , required : true},
    Task_id : {type : String , required : true},
    Task_desc : {type : String , required : true},
    Task_status : {type : String , required : true},
    Progress : {type : Number , required : true},
    Start_date : {type : String , required : true},
    End_date : {type : String , required : true},
    Duration : {type : Number , required : true}

} , {strict : true})


const Task = mongoose.model("Task" , Task_schema)

export default Task;    