var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');


//Functions.......................

function generateRandomString() {
	return Math.random().toString(36).substr(2, 6);
}

function generateRandomUsers() {
	return Math.random().toString(36).substr(2, 6);
}
//connects urls to the user that made them
function urlsForUser(id) {
	let userUrls = [];
	for(let object in urlDatabase){
		if (urlDatabase[object].user_id === id) {
			userUrls.push(urlDatabase[object]);
		}
	}
	return userUrls;
}

app.set("view engine", "ejs")

//...................................


//DATABASES........................

const users = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

var urlDatabase = [
	{shortURL:"b2xVn2", 
	longURL: "http://www.lighthouselabs.ca",
	user_id: "userRandomID" } 
	];

//..................................

//The body-parser library will allow us to access POST request parameters, 

app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
	name: 'session',
	keys: ['key1', 'key2']
}));

app.set("view engine,ejs");

//creates new array 'links' and pushes in new key/value pair
app.get("/urls", (req, res) => {
	let links = [];
	for (link in urlDatabase) {
		links.push( { link:urlDatabase[link], short_form: link, user_id:urlDatabase[link].user_id })
	}

	console.log('urls: ', req.session.user_id, req.session);

//let templateVars = {urls: urlDatabase, username: req.cookies["username"] };

	res.render("urls_index",{user_id: req.session.user_id, links: urlsForUser(req.session.user_id), user:users[req.session.user_id]});
 });

//new link shorten request page
app.get("/urls/new", (req, res) => {
	if ( !users[req.session.user_id]) {
		//console.log(users, users[req.session.user_id], req.session.user_id);
		res.status(301).redirect("/urls")
	} else {
  res.render("urls_new", {user:users[req.session.user_id]} );
  }
});

//uses the randomly generated key to access the long url and redirects to the long url
app.post("/urls", (req, res) => {
   let assign =	generateRandomString();
   for (let object in urlDatabase) {
   	if (urlDatabase[object].shortURL === assign) {
   		while (urlDatabase[object].shortURL === assign) {
   			assign = generateRandomString();
   		}
   	  }
   } 
   urlDatabase.push({
   	shortURL: assign,
   	longURL: req.body.longURL,
   	user_id: req.session.user_id
   });
  res.status(301).redirect(`/urls/${assign}`);
});

  

//shows the User The Full and tiny versions of the URL and gives them the change to edit full URL
app.get("/urls/:id", (req, res) => {

	let longUrl = urlDatabase[req.params.id];
	const link = urlDatabase.find((link) => link.shortURL === req.params.id);
	if(link) {
		let templateVars = {
		  user: users[req.session.user_id],
		  shortURL: req.params.id,
		  longUrl: link.longURL
		};
		
		res.render("urls_show", templateVars);
	} else {
		res.status(404).send("ID not found");
	}
	
});

//registration page
app.get("/register", (req, res) => {
	res.render("register", { user:users[req.session.user_id]});
}); 

//Login Page
app.get("/login",(req, res) => {
	
	res.render("login", { user:users[req.session.user_id] });
});

app.post("/register", (req, res) => {
	let newUserId = generateRandomUsers();
	if (req.body.email === "" || req.body.password === "" ){
		res.status(400).end ("Please fill in all form fields correctly");
		return;
	}

	for (let user in users) {
		if (users[user].email === req.body.email) {
			res.status(400).end(" User already Registered. try a different set of parameters");
		}
	}
	if (newUserId) {
		while (users[newUserId]) {
			newUserId = generateRandomUsers();
		}
	}

	users[newUserId] = {
		id: newUserId,
		email: req.body.email,
		password: req.body.password
	};

//encrypts password
	bcrypt.hash(req.body.password, 10, function(err, hash) {
		if (err) {
			console.log(err);
			res.status(400).end("Server error");
			return;
		}
		users[newUserId].password = hash;
		req.session.user_id = newUserId;
		res.status(301).redirect("/urls");
	 });
});
	 

//handles short url request
app.get("/u/:shortURL", (req, res) => {
	for (let object in urlDatabase) {
		if (urlDatabase[object].shortURL === req.params.shortURL) {
			let long = urlDatabase[object].longURL;
			res.status(301).redirect(long);
			return;
		}
	}
	res.status(404).end("page not found")
});
	
app.post("/urls/:id/", (req, res) => {
 	let shortURL = "";
 	let longURL = "";
 	for (let item in req.body){
 		shortURL = item;
 		longURL = req.body[item];
 	};
 	for (let object in urlDatabase) {
 		if (urlDatabase[object].shortURL === shortURL){
 			urlDatabase[object].longURL = longURL;
 		}
 	}
 	
 	res.status(301).redirect("/urls/");
 });

//handles URL Deletion
app.post("/urls/:id/delete", (req, res) => {
	if ( !users[req.session.user_id]){
		res.status(301).redirect("/urls");
	} else {
		let found = -1;
		for (let i = 0; i < urlDatabase.length; i++) {
			if(urlDatabase[i].shortURL === req.params.id && urlDatabase[i].user_id === req.session.user_id) {
				found = i;
				break;
			}
		}
		if(found >= 0) {
			urlDatabase.splice(found, 1);
		}

// delete urlDatabase[req.params.id];
	res.redirect("/urls");
  } 
});

app.post("/login", (req, res) => {
	if ( req.body.email === "" || req.body.password === "") {
		res.status(301).redirect("/login");
		return;
	} 
	let userEmailMatch = null;
	for ( let user in users) {
		if (users[user].email === req.body.email){
			userEmailMatch = user;
		}
	}
		if (userEmailMatch === null){
			res.status(403).end("incorrect email");
		} else {
			bcrypt.compare(req.body.password, users[userEmailMatch].password, function(err, response) {
				if (err) {
					console.log(err);
					res.status(500).end("server error");
					return;
				}
				if (response == true) {
					req.session.user_id = userEmailMatch;
					res.status(301).redirect("/urls");
					return;
				  } else {
					res.status(403).end("incorrect password");
					return;
				}
			});
		}
	});

			

app.post("/logout", (req, res) => {
	req.session = null;
	res.redirect("/urls")
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);

});