// Grab the articles as a json
$.getJSON("/articles", function (data) {
    // For each one
    for (var i = 0; i < data.length; i++) {
        // Display the apropos information on the page
        // console.log(data);
        $(".article-container").append("<div class='panel panel-default'><div class='panel-heading'><h3><a class='article-link' target='_blank' data-id='" + data[i]._id + "' href='" + data[i].link + "'>" + data[i].title + "</a><a class='btn btn-success save' data-id='" + data[i]._id + "' data-toggle='modal' data-target='#noteModal'>Add a Note</a></h3></div><div class='panel-body'></div></div>");

        // ("<p data-id='" + data[i]._id + "'>" + data[i].title + "<br />" + data[i].link + "</p>");
    }
});

$(document).on("click", ".save", function () {
    var thisId = $(this).attr("data-id");
    $(".modal-title").text(thisId);
    // $(".modal-title").addClass("modal-data-id", thisId);
    $(".modal-body").html("<textarea rows='4' cols='50' id='noteBox' placeholder='Enter Note Here' ></textarea>");
})


// Whenever someone clicks a p tag
$(document).on("click", "#savenote", function () {
    // Empty the notes from the note section
    var thisId = $(this).attr("data-id");
    $("#notes").empty();
    // Save the id from the p tag

    // Now make an ajax call for the Article
    $.ajax({
        method: "GET",
        url: "/articles/" + thisId
    })
        // With that done, add the note information to the page
        .then(function (data) {
            console.log(data);
            // The title of the article
            $("#notes").append("<h2>" + data.title + "</h2>");
            // An input to enter a new title
            $("#notes").append("<input id='titleinput' name='title' >");
            // A textarea to add a new note body
            $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
            // A button to submit a new note, with the id of the article saved to it
            $("#notes").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");

            // If there's a note in the article
            if (data.note) {
                // Place the title of the note in the title input
                $("#titleinput").val(data.note.title);
                // Place the body of the note in the body textarea
                $("#bodyinput").val(data.note.body);
            }
        });
});

// When you click the savenote button
$(document).on("click", "#saveNote", function () {
    // Grab the id associated with the article from the submit button
    var thisId = $(".modal-title").text();

    // Run a POST request to change the note, using what's entered in the inputs
    $.ajax({
        method: "POST",
        url: "/articles/" + thisId,
        data: {
            // Value taken from title input
            title: $(".modal-title").text(),
            // Value taken from note textarea
            body: $("textarea").val()
        }
    })
        // With that done
        .then(function (data) {
            // Log the response
            console.log(data);
            // Empty the notes section
            $("#notes").empty();
        });

    // Also, remove the values entered in the input and textarea for note entry
    $("#titleinput").val("");
    $("#bodyinput").val("");
});
