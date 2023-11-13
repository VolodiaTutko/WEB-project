document.addEventListener("DOMContentLoaded", function() {
console.log("DOM fully loaded and parsed");
const dropdownButton = document.getElementById("dropdown-button");
const dropdownContent = document.getElementById("dropdown-content");
// const uploadForm = document.getElementById('csvUploadForm');

// uploadForm.addEventListener('submit', function (event) {
//     // event.preventDefault(); 

   
//     setTimeout(function() {
//         uploadForm.reset();
//     }, 10000); 
// });

dropdownButton.addEventListener("click", function() {
  
    if (dropdownContent.classList.contains("hidden")) {
       
        dropdownContent.classList.remove("hidden");
        dropdownContent.classList.add("show");
    } else {
        
        dropdownContent.classList.remove("show");
        dropdownContent.classList.add("hidden");
    }
});

});