/* imports */
require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()

//Config JSON response
app.use(express.json())

// Models 
const User = require('./models/User')

// Open Route - Public Route
app.get('/', (req, res) => {
    res.status(200).json({ msg: 'Bem vindo a nossa API! '})
})

// Private Route
app.get("/user/:id", checkToken, async (req, res) => {
  const id = req.params.id

  //check if user exists
  const user = await User.findById(id, '-password')

  if(!user) {
    return res.status(404).json({msg : 'Usuario nao encontrado'})
  }

  res.status(200).json({ user })
}) 

function checkToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(" ")[1]

  if(!token) {
    return res.status(401).json({ msg: 'Acesso negado! '})
  }

  try {
    const secret = process.env.SECRET

    jwt.verify(token, secret)

    next()
  } catch(error) { 
    res.status(400).json({msg: 'Token Invalido! '})
  }
}

// Register User 
app.post('/auth/register', async(req, res) => {
  const {name, email, password, confirmpassword} = req.body

  // validations
  if(!name) {
    return res.status(442).json({ msg: 'O nome eh obrigatorio!' })
  }

  if(!email) {
    return res.status(442).json({ msg: 'O email eh obrigatorio!' })
  }

  if(!password) {
    return res.status(442).json({ msg: 'A senha eh obrigatorio!' })
  }

  if(password !== confirmpassword) {
    return res.status(442).json({ msg: 'as senhas nao conferem' })
  }

  // Check if user exists
  const userExists = await User.findOne({ email: email})

  if(userExists) {
    return res.status(422).json({ msg: 'Por favor, utlize outro email!'})
  }

  // create password
  const salt = await bcrypt.genSalt(12)
  const passwordHash = await bcrypt.hash(password, salt)

  // create user
  const user = new User({
    name,
    email,
    password: passwordHash,
  })

  try {
    await user.save()

    res.status(201).json({msg: 'Usuario criado com Sucesso!'})
  } catch(error) {
    console.log(error)

    res.status(500).json({
        msg: 'aconteceu um erro no servidor , tente novamente mais tarde',
    })
  }
})

// Login User 
app.post("/auth/login", async (req, res) => {
  const {email, password} = req.body

  // validations
  if(!email) {
    return res.status(442).json({ msg: 'O email eh obrigatorio!' })
  }

  if(!password) {
    return res.status(442).json({ msg: 'A senha eh obrigatorio!' })
  }

  // check if user exists 
  const user = await User.findOne({ email: email})

  if(!user) {
    return res.status(404).json({ msg: 'usuario nao encontrado'})
  }

  // check if password match
  const checkPassword = await bcrypt.compare(password, user.password)

  if(!checkPassword){
    return res.status(422).json({ msg: 'senha invalida'})
  }

  try{
    const secret = process.env.SECRET 

    const token = jwt.sign(
      {
      id: user._id,
    },
    secret,
    )

    res.status(200).json({msg: 'Autenticacao realizada com sucesso', token})

  } catch(err) {
    console.log(error)

    res.status(500).json({
        msg: 'aconteceu um erro no servidor , tente novamente mais tarde',
    })
  }




})

// Credencials
const dbUser = process.env.DB_User
const dbPassword = process.env.DB_Pass


mongoose
    .connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.7mfpoeg.mongodb.net/?retryWrites=true&w=majority`)
    .then(() => {
        app.listen(3000)
        console.log('Conectou ao banco!')
    })
    .catch((err) => console.log(err))


