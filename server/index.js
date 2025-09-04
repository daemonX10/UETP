import connectDB from "./src/db/dbConnection.js"
import {app} from './app.js'
import { configDotenv } from "dotenv"


configDotenv({
    path : '/env'
})

connectDB()
.then(
    ()=>{
        app.listen( 8000, ()=>{
            console.log(`server is running at port: 8000` )
        })
    }
)
.catch((err)=>{
    console.log(`DB Connection ERROR !!` , err)
})