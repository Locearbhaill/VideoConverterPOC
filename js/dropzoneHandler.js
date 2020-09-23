(function () {
    // console.log("test");
    var dropzone = document.getElementById('dropzone'); // select element by your given name

    dropzone.ondrop = function(e) { // e for event
        e.preventDefault(); // Prevent browser from instantly opening uploaded file
        this.className = 'dropzone';
        // upload(e.dataTransfer.files);
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