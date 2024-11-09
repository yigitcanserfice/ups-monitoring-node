const deviceDataDiv = document.getElementById("device-data");
const socket = new WebSocket("ws://localhost:8765");

// Cihaz verilerini saklamak için bir nesne
const devices = {};

socket.onmessage = function (event) {
  const updatedDevice = JSON.parse(event.data);

  // Cihazları güncelle veya ekle
  for (const device_id in updatedDevice) {
    devices[device_id] = updatedDevice[device_id];
  }
  updateDeviceData();
};

function updateDeviceData() {
  deviceDataDiv.innerHTML = ""; // Önceki içerikleri temizle

  const locationFilter = document.getElementById("location").value;
  const modelFilter = document.getElementById("model").value;
  const statusFilter = document.getElementById("status").value;

  // Her bir cihazı filtrele
  for (const device_id in devices) {
    const device = devices[device_id];
    const deviceLocation = device.location;
    const deviceModel = device.model;
    const deviceStatus = device.status;

    const locationMatch = locationFilter
      ? deviceLocation === locationFilter
      : true;
    const modelMatch = modelFilter ? deviceModel === modelFilter : true;
    const statusMatch = statusFilter ? deviceStatus === statusFilter : true;

    if (locationMatch && modelMatch && statusMatch) {
      deviceDataDiv.innerHTML += `
    <div class="device ${device.status}" data-location="${
        device.location
      }" data-model="${device.model}" data-status="${device.status}">
        <div class="device-header">
            <div class="device-name">
                <h2>${device.device_name}</h2>
                <span class="device-model">${device.model}</span>
            </div>
            <div class="status-badge ${device.status}">
                ${device.status === "online" ? "Çevrimiçi" : "Çevrimdışı"}
            </div>
        </div>

        <div class="device-info-grid">
            <div class="info-item">
                <div class="info-label">MAC Adresi</div>
                <div class="info-value">${device.mac_address}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Konum</div>
                <div class="info-value">${device.location}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Sıcaklık</div>
                <div class="info-value ${
                  device.temperature > 25.5 ? "warning" : "normal"
                }">
                    ${device.temperature.toFixed(1)}°C
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Pil Seviyesi</div>
                <div class="info-value">
                    <div class="battery-indicator">
                        <div class="battery-level ${
                          device.battery_level < 50 ? "low" : ""
                        }" style="width: ${device.battery_level}%"></div>
                    </div>
                    <span>${device.battery_level}%</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Giriş Volt</div>
                <div class="info-value">${device.giris_volt} V</div>
            </div>
            <div class="info-item">
                <div class="info-label">Çıkış Volt</div>
                <div class="info-value">${device.cikis_volt} V</div>
            </div>
        </div>

        <div class="device-footer">
            ${
              device.alarm !== "Normal"
                ? `<div class="alarm-badge">
                    <span class="alarm-icon">⚠️</span> ${device.alarm}
                </div>`
                : ""
            }
            <button class="toggle-btn ${
              device.status
            }" onclick="toggleDevice('${device_id}')">
                ${device.status === "online" ? "Kapat" : "Aç"}
            </button>
        </div>
    </div>
`;
    }
  }
}

function toggleDevice(device_id) {
  socket.send(JSON.stringify({ action: "toggle", device_id }));
}

function filterDevices(event) {
  event.preventDefault(); // Formun varsayılan gönderimini engelle
  updateDeviceData(); // Filtreleme kriterleri değiştiği için verileri güncelle
}

socket.onopen = function () {
  console.log("WebSocket bağlantısı açıldı.");
};

socket.onclose = function () {
  console.log("WebSocket bağlantısı kapandı.");
};
