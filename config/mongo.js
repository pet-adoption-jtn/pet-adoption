const { MongoClient, ObjectID } = require('mongodb')
const uri = 'mongodb://localhost:27017'

const client = new MongoClient(uri, { useUnifiedTopology: true })

const connect = async () => await client.connect()
connect()

let db;

db = client.db('adopt-us')

module.exports = {
  db,
  ObjectID
}