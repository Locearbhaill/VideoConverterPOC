(function () {
    // console.log("test");
    var dropzone = document.getElementById('dropzone'); // select element by your given name

    var upload = function(files) {
        var formData = new FormData(),
            xhr = new XMLHttpRequest(),
            x;

        for (x=0; x < files.length; x = x + 1 ) {
            formData.append('file[]', files[x]); // Add all files to upload
        }

        xhr.onload = function() {
            var data = this.responseText; // response from ajax request
            console.log(data);

        }

        xhr.open('post', '../upload.php'); // post to php VideoConverterPOC\php\upload.php 
        xhr.send(formData); // post data to php

    }

    dropzone.ondrop = function(e) { // e for event
        e.preventDefault(); // Prevent browser from instantly opening uploaded file
        this.className = 'dropzone';
        upload(e.dataTransfer.files);
    };

    dropzone.ondragover = function() { // set the dragover behaviour 
        this.className = 'dropzone dragover';
        return false;
    };
    dropzone.ondragleave = function() { // set on leave drag space behaviour 
        this.className = 'dropzone';
        return false;
    };

}());