if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const cors = require('cors')
const routes = require('./routes/index')
const err_handler = require('./middlewares/error_handler')

const app = express()
const PORT = 4000

app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(routes)
app.use(err_handler)

app.listen(PORT, () => console.log('listening at port', PORT))

module.exports = app