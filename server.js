var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");
var Note = db.Note;

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Connect to the Mongo DB
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/onionscraperdb";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

// Routes

app.get("/", function (req, res) {
    res.render("index");
});

app.get("/saved", function (req, res) {
    res.render("saved");
});

// A GET route for scraping the echoJS website
app.get("/scrape", function (req, res) {
    // First, we grab the body of the html with request
    axios.get('https://www.theonion.com/c/news-in-brief')
        .then(response => {
            // data from the onion
            const $ = cheerio.load(response.data);

            // stores title, image, and link for each article
            $('div.item__content').each((i, element) => {
                const article = {};

                article.title = $(element)
                    .find('h1')
                    .text();

                article.img = $(element)
                    .find('.img-wrapper picture')
                    .children()
                    .first()
                    .attr('data-srcset');

                article.link = $(element)
                    .find('.headline a')
                    .attr('href');

                article.excerpt = $(element)
                    .find('.excerpt')
                    .first()
                    .text();

                // prevents duplicate articles by checking if the article title exists in the db
                // if the article title does not exist, then it saves the article
                // creates new article if it does not exist
                db.Article.update({ title: article.title }, { $set: article }, { upsert: true }).catch(
                    err => res.send(err)
                );
            });
        })
    // If we were able to successfully scrape and save an Article, send a message to the client
    res.send("Scrape Complete");
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
    // Grab every document in the Articles collection
    db.Article.find({})
        .then(function (dbArticle) {
            // If we were able to successfully find Articles, send them back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

app.get("/clear", (req, res) => {
    db.Article.deleteMany({})
        .then(() => {
            User.deleteMany({}).then(() => {
                Note.deleteMany({}).then(() => res.redirect('/'));
            });
        })
        .catch(err => res.json(err));
});

app.get("/notes", function (req, res) {
    db.Note.find({})
        .then(function (dbNote) {
            res.json(dbNote);
        })
        .catch(function (err) {
            res.json(err);
        });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({ _id: req.params.id })
        // ..and populate all of the notes associated with it
        .populate("note")
        .then(function (dbArticle) {
            // If we were able to successfully find an Article with the given id, send it back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

app.get("/notes/:id", function (req, res) {
    db.Note.findOne({_id: req.params.id})
        .then(function(dbNote) {
            res.json(dbNote);
        })
        .catch(function (err) {
            res.json(err);
        });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
        .then(function (dbNote) {
            // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        })
        .then(function (dbArticle) {
            // If we were able to successfully update an Article, send it back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

app.post('/saveNote', (req, res) => {
    // creates a new Note document
    const newNote = new Note({ body: req.body.body });

    // will hold the noteId once it is created so that it can be used to save to the user
    let noteId = null;

    // saves the new document
    newNote
        .save()
        // contains the result of the saved note after its saved to the db
        .then(result => {
            // sets the noteId variable so it can be used outside of this scope
            noteId = result._id;

            // saves the newNote _id to the notes array for the article
            db.Article.findOneAndUpdate(
                { _id: req.body.articleId },
                { $addToSet: { notes: noteId } },
                { new: true }
            )
                // save note to the user once the note has been saved to the article
                .then(() => res.send('Note Saved'))
                .catch(() => res.send('Could not save note'));
        })
        .catch(err => res.send(err));
});

app.post('/getArticleNotes', (req, res) => {
    db.Article.find({ _id: req.body.articleId })
        .populate('notes')
        .then(result => res.send({ username: req.user.username, result: result[0].notes }))
        .catch(() => res.send('An error ocurred while retrieving the notes'));
});

app.post('/removeNote', (req, res) => {
    db.Article.update({ _id: req.body.articleId }, { $pull: { notes: { $in: [req.body.noteId] } } })
        .then(removeRes => {
            // if the write result removed value is greater than 0, then it was a success
            if (removeRes.n > 0) {
                res.send('success');
            }

            // if not, then there was an error
            else {
                res.send('An error occured while trying to remove the note');
            }
        })
        .catch(() => res.send('An error occured while trying to remove the note'));
});

// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});
