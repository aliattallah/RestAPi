const express = require ('express')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt-nodejs')
const cors= require('cors')
const knex = require('knex')

const db= knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'Alyy',
    database : 'smart-brain'
  }
});
db.select('*').from('users').then(data => {
	console.log(data)
}) 

const app = express();

app.use(express.json());
app.use(cors())

const database = {
	users: [
	{
		id: '123',
		name: 'John',
		email: 'john@gmail.com',
		password: 'cookies',
		entries: 0,
		joined: new Date()
	},
	{
		id: '124',
		name: 'Sally',
		email: 'Sally@gmail.com',
		password: 'Banana',
		entries: 0,
		joined: new Date()
	}
	],
	login: [
	{
		id: '978',
		hash: '',
		email: 'john@gmail.com'
	}]
}

app.get('/', (req,res) =>{
	res.send(database.users) 
})

app.post('/signin',(req,res) => {
	db.select('email','hash').from('login')
	.where('email','=',req.body.email)
	.then(data => {
	const isValid = bcrypt.compareSync(req.body.password, data[0].hash); 
	if(isValid){
		return db.select('*').from('users').where('email','=',req.body.email)
		.then(user => {
        res.json(user[0])
		})
		.catch(err => res.status(400).json('unable to get user'))
	}
	})
	.catch(err => res.status(400).json('wrong credentials'))
})

app.post('/register',(req,res) =>{
	const {email, name, password} = req.body
	if(!email || !name || !password ) {
		return res.status(400).json('incorrect')
	}
	const hash = bcrypt.hashSync(password)
db.transaction(trx => {
	trx.insert ({
		hash: hash,
		email: email
	})
	.into('login')
	.returning('email')
	.then(loginEmail => {
		return trx('users')
.returning('*')
.insert({
	email: loginEmail[0],
	name: name,
	joined: new Date()
}).then(user => {
	res.json(user[0])

})

	})
	.then(trx.commit)
	.catch(trx.rollback)
})
.catch(err => res.status(400).json('unable to join'))
})

app.get('/profile/:id',(req,res) => {
	const {id} = req.params;
db.select('*').from('users').where({
	id: id
})
.then(user => {
	if(user.length) {
		res.json(user[0])
	} else {
		res.status(400).json('not found')
	}
})
.catch(err => res.status(400).json('error getting user'))
})

app.put('/image', (req,res) => {
		const {id} = req.body;
	let found = false
db('users').where('id', '=', id)
  .increment('entries', 1)
  .returning('entries')
  .then(entries => {
  	res.json(entries[0])
  })
  .catch(err => res.status(400).json('unable to get entries'))
}) 




// Load hash from your password DB.
//bcrypt.compare("bacon", hash, function(err, res) {
    // res == true
//});
//bcrypt.compare("veggies", hash, function(err, res) {
    // res = false
//});

app.listen(process.env.PORT || 3000, () =>{
	console.log(`running on 3000 ${process.env.PORT}`)
})
