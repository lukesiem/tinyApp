var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

function generateRandomString() {
	return Math.random().toString(36).substr(2, 6);
}

app.set("view engine", "ejs")

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
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

	let templateVars = {urls: urlDatabase, username: req.cookies["username"] };
	res.render("urls_index",{links: links, username: req.cookies.username});
 });

//new link shorten request page
app.get("/urls/new", (req, res) => {
  res.render("urls_new", {username: req.cookies["username"]} );
});


//uses the randomly generated key to access the long url and redirects to the long url
app.post("/urls", (req, res) => {
   let assign =	generateRandomString();
   urlDatabase[assign] = req.body.longURL;
   console.log(urlDatabase);
  console.log(req.body.longURL);  // debug statement to see POST parameters
  res.redirect("urls/" + assign);         // Respond with 'Ok' (we will replace this)
});


app.get("/urls/:id", (req, res) => {

	let longUrl = urlDatabase[req.params.id];
	let templateVars = {shortURL: req.params.id,longUrl:longUrl, username: req.cookies["username"]};
	res.render("urls_show", templateVars);

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
 	console.log(shortURL, longURL)
 	urlDatabase[shortURL] = longURL;
 	res.status(301).redirect("/urls/");
 });

app.post("/urls/:id/delete", (req, res) => {
	let assign = req.params.id;
	 delete urlDatabase[assign];
	res.redirect("/urls");

});

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.status(301).redirect("/urls");
});

app.post("/logout", (req, res) => {
	res.clearCookie("username");
	res.redirect("/urls")
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);

});