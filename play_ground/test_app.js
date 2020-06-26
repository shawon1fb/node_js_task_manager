const mongoDb = require("mongodb")
const MongoClient = mongoDb.MongoClient;

const connectionUrl = 'mongodb://localhost:27017';
const dbName = 'DB';
MongoClient.connect(connectionUrl, {useUnifiedTopology: true}, (error, client) => {

    if (error) {
        console.log(error)
        console.log("unable to connect")
    }
    console.log("connection successful")
    let db = client.db("BUBT_students");
    let collection = db.collection("student_details");

    let query = {
         "_id": "15162103063"
    };
    let cursor = collection.find(query);

    cursor.forEach(
        function (doc) {
            console.log(doc);
        },
        function (err) {
            console.log(err)
            client.close();
        }
    );
})