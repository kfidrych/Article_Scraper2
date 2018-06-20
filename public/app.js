// Grab the articles as a json
$.getJSON("/articles", function (data) {
    console.log(data);
    // For each one
    for (var i = 0; i < data.length; i++) {
        // Display the apropos information on the page
        $("#articleContainer").append("<div class='panel panel-default'><div class='panel-heading'><h3><a class='article-link' target='_blank' data-id='" + data[i]._id + "' href='" + data[i].link + "'>" + data[i].title + "</a><a class='btn btn-success save' data-id='" + data[i]._id + "' data-toggle='modal' data-target='#noteModal'>Add a Note</a></h3></div><div class='panel-body'></div></div>");

        if (data[i].notes.length > 0) {
            $("#notesContainer").append("<div class='panel panel-default'><div class='panel-heading'><h3><a class='article-link' target='_blank' data-id='" + data[i]._id + "' href='" + data[i].link + "'>" + data[i].title + "</a><a class='btn btn-danger delete' data-id='" + data[i]._id + "'>Delete Note</a></h3></div><div class='panel-body' id='noteBody'></div></div>");
            for (var x=0; x<data[i].notes.length; x++) {
                $.getJSON("/notes/" + data[i].notes[x], function(results) {
                    $("#noteBody").append(results.body);
                })
            }

            var notes = [];
            for (var x = 0; x < data[i].notes.length; x++) {
                notes.push(data[i].notes[x]);
                // $("#noteBody").append(data[i].notes[x]);
            //     for (var i = 0; i < notes.length; i++) {
            //         $.getJSON("/notes/" + notes[i], function (data) {
            //             var comments = [];
            //             comments.push(data.body)
            //             console.log(data.body);
            //         })
            //     }
            }
            

            

            // $.getJSON("/articles/" + articleId, function (data) {
            //     console.log(data);
            //     var note = data.note.body;
            //     console.log("Note: " + note);
            //     $("#noteBody").text(data.note.body);
            // });

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
$(document).on("click", "#saveNote", function (req, res) {
    $.ajax({
        method: "POST",
        url: "/saveNote",
        data:
        {
            body: $('textarea')
                .val()
                .trim(),
            articleId: $(".modal-title").text()
        }
    }),
        function (result) {
            console.log(result);
        };
});

