import Session from "../DB/schema/session.js";

const getSessionInfo = async(req , res , next) => {
    const session_id = req.cookies.SessionID;

    if (!session_id) {
        return res.status(401).json({message : "Un-authorized access , No Session"})
    }

    const session_exists = await Session.findOne({"SessionID" : session_id})

    if (!session_exists) {
        return res.status(401).json({message : "No Session Exists"})
    }

    req.userID = session_exists.UID
    next()
}

export default getSessionInfo;