// Grab the articles as a json
$.getJSON("/articles", function (data) {
    // For each one
    for (var i = 0; i < data.length; i++) {
        // Display the apropos information on the page
        $("#articleContainer").append("<div class='panel panel-default'><div class='panel-heading'><h3><a class='article-link' target='_blank' data-id='" + data[i]._id + "' href='" + data[i].link + "'>" + data[i].title + "</a><a class='btn btn-success save' data-id='" + data[i]._id + "' data-toggle='modal' data-target='#noteModal'>Add a Note</a></h3></div><div class='panel-body'></div></div>");

        if (data[i].note) {
            articleId = data[i]._id;
            $("#notesContainer").append("<div class='panel panel-default'><div class='panel-heading'><h3><a class='article-link' target='_blank' data-id='" + data[i]._id + "' href='" + data[i].link + "'>" + data[i].title + "</a><a class='btn btn-danger delete' data-id='" + data[i]._id + "'>Delete Note</a></h3></div><div class='panel-body' id='noteBody'></div></div>");
            $.getJSON("/articles/" + articleId, function (data) {
                var note = data.note.body;
                console.log("Note: " + note);
                $("#noteBody").text(data.note.body);
            });
            
        }
    }
});

$(document).on("click", ".save", function () {
    var thisId = $(this).attr("data-id");
    $(".modal-title").text(thisId);
    // $(".modal-title").addClass("modal-data-id", thisId);
    $(".modal-body").html("<textarea rows='4' cols='50' id='noteBox' placeholder='Enter Note Here' ></textarea>");
})

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
        });
});
