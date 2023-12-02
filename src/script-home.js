document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded and parsed");

  const dropdownButton = document.getElementById("dropdown-button");
  const dropdownContent = document.getElementById("dropdown-content");

  dropdownButton.addEventListener("click", function () {
    if (dropdownContent.classList.contains("hidden")) {
      dropdownContent.classList.remove("hidden");
      dropdownContent.classList.add("show");
    } else {
      dropdownContent.classList.remove("show");
      dropdownContent.classList.add("hidden");
    }
  });

  fetchTaskStatus();

  function fetchTaskStatus() {
    $.ajax({
      url: "/getTaskStatus",
      type: "GET",
      success: function (taskStatus) {
        $("#tasks").html(taskStatus);
        addEventListeners();
      },
      error: function (xhr, status, error) {
        console.error("AJAX request failed with error:", error);
      },
    });
  }

  setInterval(fetchTaskStatus, 1000);

  function addEventListeners() {
    const deleteButtons = document.querySelectorAll(".btn-delete");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const taskId = this.getAttribute("data-taskid");
        console.log("Deleting...");
        console.log(taskId);

        $.ajax({
          url: `/deleteTask/${taskId}`,
          type: "POST",
          success: function () {
            const taskElement = document.getElementById(`task-${taskId}`);
            if (taskElement) {
              taskElement.remove();
              //`console.log(`Task ${taskId} was deleted`);
            }
          },
          error: function (xhr, status, error) {
            console.error("AJAX request failed with error:", error);
          },
        });
      });
    });

    const cancelButtons = document.querySelectorAll(".btn-cancel");
    cancelButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const taskId = this.getAttribute("data-taskid");
        console.log("Canceling...");
        console.log(taskId);

        $.ajax({
          url: `/cancelTask/${taskId}`,
          type: "POST",
          success: function (result) {
            console.log(result);
          },
          error: function (xhr, status, error) {
            console.error("AJAX request failed with error:", error);
          },
        });
      });
    });
  }
});
