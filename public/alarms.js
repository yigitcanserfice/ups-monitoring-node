function applyFilters() {
  const dateFilter = document.getElementById("dateFilter").value;
  const alarmTypeFilter = document.getElementById("alarmTypeFilter").value;
  const locationFilter = document.getElementById("locationFilter").value;
  const deviceNameFilter = document.getElementById("deviceNameFilter").value;
  const sortOrder = document.getElementById("sortOrder").value;

  const queryParams = new URLSearchParams({
    dateFilter,
    alarmTypeFilter,
    locationFilter,
    deviceNameFilter,
    sortOrder,
  });

  fetch(`/user/devices/alarms?${queryParams.toString()}`)
    .then((response) => response.text())
    .then((html) => {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;

      const newTbody = tempDiv.querySelector("tbody");
      if (newTbody) {
        document.getElementById("alarmTableBody").innerHTML =
          newTbody.innerHTML;
        formatAllDates(); // Tarihleri formatla
      }
    })
    .catch((error) => console.error("Alarmlar getirilemedi:", error));
}

function formatAllDates() {
  const dateCells = document.querySelectorAll("#alarmTableBody #date");
  dateCells.forEach((cell) => {
    const originalDate = cell.textContent;
    const formattedDate = formatTimestamp(originalDate);
    cell.textContent = formattedDate;
  });
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
formatAllDates();
