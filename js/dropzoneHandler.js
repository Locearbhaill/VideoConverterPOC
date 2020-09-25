(function () {
    // console.log("test");
    var dropzone = document.getElementById('dropzonefile'); // select element by your given name
    // TODO: Make this upload function serverside as cannot call from here
    var upload = function(files) {
        var formData = new FormData(),
            xhr = new XMLHttpRequest(),
            x;
        // var x;

        for (x=0; x < files.length; x = x + 1 ) {
            formData.append('file[]', files[x]); // Add all files to upload form
        }

        xhr.onload = function() {
            var data = this.responseText; // response from ajax request
            console.log(data);

        }

        xhr.open('post', 'js/upload.php'); // post to php VideoConverterPOC\php\upload.php 
        // The reason this post doesn't work is because I am calling serverside functions and code within 
        // the browser script, this means that i need to move the upload function to within the server code.
        xhr.send(formData); // post data to php
        console.log("Got here");
        console.log(formData);
        console.log(files);
        console.log(files[0]);

        // for (x=0; x < files.length; x++) { // This is serverside code and therefore will not run as browser script..
        //     files[x].mv("tmp/" + files.name, function (err) {
        //         if (err) return (err);
        //         console.log("File uploaded succesfully");
        //     })
        // }


        // console.log(formData);
        

    }

    dropzone.ondrop = function(e) { // e for event
        e.preventDefault(); // Prevent browser from instantly opening uploaded file
        this.className = 'dropzone';
        upload(e.dataTransfer.files);
    };

    dropzone.ondragover = function(e) { // set the dragover behaviour 
        e.preventDefault();
        this.className = 'dropzone dragover';
        return false;
    };
    dropzone.ondragleave = function(e) { // set on leave drag space behaviour 
        e.preventDefault();
        this.className = 'dropzone';
        return false;
    };

}());