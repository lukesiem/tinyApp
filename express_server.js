var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

//RANDOMIZERS.......................

function generateRandomString() {
	return Math.random().toString(36).substr(2, 6);
}

function generateRandomUsers() {
	return Math.random().toString(36).substr(2, 6);
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

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
//..................................

//The body-parser library will allow us to access POST request parameters, 
//store in a variable called urlDatabase

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine,ejs");

//creates new array 'links' and pushes in new key/value pair
app.get("/urls", (req, res) => {
	let links = [];
	for (link in urlDatabase) {
		links.push( { link:urlDatabase[link], short_form: link })
	}

	//let templateVars = {urls: urlDatabase, username: req.cookies["username"] };
	res.render("urls_index",{links: links, user_id:users[req.cookies.user_id]});
 });

//new link shorten request page
app.get("/urls/new", (req, res) => {
  res.render("urls_new", {user_id:users[req.cookies.user_id]} );
});


//uses the randomly generated key to access the long url and redirects to the long url
app.post("/urls", (req, res) => {
   let assign =	generateRandomString();
   urlDatabase[assign] = req.body.longURL;
  
  console.log(req.body.longURL);  // debug statement to see POST parameters
  res.redirect("urls/" + assign);         // Respond with 'Ok' (we will replace this)
});


app.get("/urls/:id", (req, res) => {
	console.log('IN URLS/ID');
	let longUrl = urlDatabase[req.params.id];
	let templateVars = {
	  user_id: users[req.cookies.user_id],
	  shortURL: req.params.id,
	  longUrl: longUrl
	};
	
	res.render("urls_show", templateVars);

});

app.get("/register", (req, res) => {
	res.render("register", { user_id: users[req.cookies.user_id]});
}); 

app.get("/login",(req, res) => {
	
	res.render("login", { user_id:users[req.cookies.user_id] });


});

app.post("/register", (req, res) => {
	let newUserId = generateRandomUsers();
	if (req.body.email === "" || req.body.password === "" ){
		res.status(400).end ("Please fill in all form fields correctly");

	}
	for (user in users) {
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
	 
	res.cookie("user_id", newUserId);
	res.status(301).redirect("/urls")
});

//handles short url request. makes sure http:// is attached
app.get("/u/:shortURL", (req, res) => {
	let substring = "http://"
	let longURL = urlDatabase[req.params.shortURL]
	if(longURL.indexOf(substring) !== -1){
		res.redirect(longURL); 
	} else {
		res.redirect("http://" + longURL);
	}
});

 app.post("/urls/:id/", (req, res) => {
 	let shortURL = "";
 	let longURL = "";
 	for (let item in req.body){
 		shortURL = item;
 		longURL = req.body[item];
 	};
 	
 	urlDatabase[shortURL] = longURL;
 	res.status(301).redirect("/urls/");
 });

app.post("/urls/:id/delete", (req, res) => {
	delete urlDatabase[req.params.id];
	res.redirect("/urls");

});

app.post("/login", (req, res) => {
	if ( req.body.email === "" || req.body.password === "") {
		res.status(301).redirect("/login");
		return;
	} 
	for (user in users) {
	if (users[user].email === req.body.email){
		if (users[user].password === req.body.password){
			res.cookie("user_id", users[user].id);
     		res.status(301).redirect("/urls");
     		return;
     	} else {
     		res.status(403).end("you have entered you password or email incorrectly");
     	} 
     }
 }
  res.status(403).end("you have entered you password or email incorrectly")
});

app.post("/logout", (req, res) => {
	res.clearCookie("user_id");
	res.redirect("/urls")
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);

});