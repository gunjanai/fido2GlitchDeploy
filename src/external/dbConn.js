const { default: mongoose } = require('mongoose')

const MongoClient = require('mongodb').MongoClient

// const generateDBConnection = async () => {
//     const conn = new MongoClient("mongodb+srv://gunjan:7999797002@passwordlessauth.ukm2zte.mongodb.net/?retryWrites=true&w=majority")
//     try{
//         const connection = await conn.connect()
//         return connection
//     }catch(err) {
//         throw new Error(err)
//     }
// }
const generateDBConnection = async () => {
    mongoose.connect("mongodb+srv://gunjan:7999797002@passwordlessauth.ukm2zte.mongodb.net/?retryWrites=true&w=majority")
    const connection = mongoose.connection
        return connection
}

module.exports = generateDBConnection