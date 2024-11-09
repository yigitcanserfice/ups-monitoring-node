const socket = new WebSocket("ws://localhost:8765");

// Cihaz durumlarını saklamak için global nesne
const deviceStates = {};

socket.onmessage = function (event) {
  const data = JSON.parse(event.data);

  for (const macAddress in data) {
    if (data.hasOwnProperty(macAddress)) {
      const deviceData = data[macAddress];
      updateDeviceUI(macAddress, deviceData);
    }
  }

  // Filtreleri yeniden uygula
  filterDevices();
};

function updateDeviceUI(macAddress, deviceData) {
  const deviceElement = document.getElementById(`device-${macAddress}`);
  if (!deviceElement) return;

  // Cihaz durumunu güncelle
  deviceStates[macAddress] = deviceData;

  // Data özelliklerini güncelle
  deviceElement.setAttribute("data-model", deviceData.model);
  deviceElement.setAttribute("data-location", deviceData.location);

  // Status badge'i güncelle
  const statusElement = document.getElementById(`status-${macAddress}`);
  if (statusElement) {
    statusElement.textContent =
      deviceData.status === "online" ? "Çevrimiçi" : "Çevrimdışı";
    statusElement.className = `status-badge ${deviceData.status}`;
  }

  // Pil seviyesi progress bar'ını güncelle
  const batteryLevelElement = document.getElementById(
    `battery-level-${macAddress}`
  );
  if (batteryLevelElement) {
    batteryLevelElement.style.width = `${deviceData.battery_level}%`;
    batteryLevelElement.className = `battery-level ${
      deviceData.battery_level < 50 ? "low" : ""
    }`;
  }

  // Temel değerleri güncelle
  updateElementValue(`battery-${macAddress}`, `${deviceData.battery_level}%`);
  updateElementValue(
    `temp-${macAddress}`,
    `${deviceData.temperature.toFixed(1)}°C`
  );
  updateElementValue(`giris-${macAddress}`, `${deviceData.giris_volt} V`);
  updateElementValue(`cikis-${macAddress}`, `${deviceData.cikis_volt} V`);

  // Alarm durumunu güncelle
  const alarmElement = document.getElementById(`alarm-${macAddress}`);
  if (alarmElement) {
    if (deviceData.alarm !== "Normal") {
      alarmElement.innerHTML = `<span class="alarm-icon">⚠️</span> ${deviceData.alarm}`;
      alarmElement.style.display = "block";
    } else {
      alarmElement.style.display = "none";
    }
  }

  // Toggle butonunu güncelle
  const btnElement = document.getElementById(`btn-${macAddress}`);
  if (btnElement) {
    btnElement.textContent = deviceData.status === "online" ? "Kapat" : "Aç";
    btnElement.className = `toggle-btn ${deviceData.status}`;
  }

  // Sıcaklık uyarısını kontrol et
  const tempElement = document.getElementById(`temp-${macAddress}`);
  if (tempElement) {
    tempElement.className =
      deviceData.temperature > 25.5 ? "info-value warning" : "info-value";
  }

  // Cihaz kartının genel durumunu güncelle
  deviceElement.className = `device ${deviceData.status}`;
}

function updateElementValue(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  }
}

function filterDevices() {
  const statusFilter = document.getElementById("statusFilter").value;
  const modelFilter = document.getElementById("modelFilter").value;
  const locationFilter = document.getElementById("locationFilter").value;

  const devices = document.querySelectorAll(".device");

  devices.forEach((device) => {
    const deviceStatus = device.classList.contains("online")
      ? "online"
      : "offline";
    const deviceModel = device.getAttribute("data-model");
    const deviceLocation = device.getAttribute("data-location");

    const matchesStatus = !statusFilter || deviceStatus === statusFilter;
    const matchesModel = !modelFilter || deviceModel === modelFilter;
    const matchesLocation =
      !locationFilter || deviceLocation === locationFilter;

    device.style.display =
      matchesStatus && matchesModel && matchesLocation ? "block" : "none";
  });
}

function toggleDevice(macAddress) {
  socket.send(
    JSON.stringify({
      action: "toggle",
      device_id: macAddress,
    })
  );
}

socket.onopen = function () {
  console.log("WebSocket bağlantısı açıldı.");
};

socket.onclose = function () {
  console.log("WebSocket bağlantısı kapandı.");
};

// Sayfa yüklendiğinde filtreleri uygula
document.addEventListener("DOMContentLoaded", filterDevices);
