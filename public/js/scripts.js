const fetchBusData = async () => {
  try {
    const response = await fetch("/next-departure");

    if (!response.ok) {
      throw new Error(`HTTP error. Status: ${response.status}`);
    }

    return response.json();
  } catch (e) {
    console.error(`Ошибка получения данных: ${e}`);
  }
};

const formatDate = (date) => date.toISOString().split("T")[0].toString().split('-').reverse().join('.');
const formatTime = (date) => date.toTimeString().split(" ")[0].slice(0, 5);

const renderBusData = (buses) => {
  const tableBody = document.querySelector("#bus tbody");
  tableBody.textContent = "";

  buses.forEach(bus => {
    const row = document.createElement("tr");
    const nextDepartureDateTimeUTC = new Date(`${bus.nextDeparture.date}T${bus.nextDeparture.time}Z`);

    row.innerHTML = `
      <td>${bus.busNumber}</td>
      <td>${bus.startPoint} - ${bus.endPoint}</td>
      <td>${formatDate(nextDepartureDateTimeUTC)}</td>
      <td>${formatTime(nextDepartureDateTimeUTC)}</td>
      <td>-</td>
    `;

    tableBody.append(row);
  });
};

const currentTime = () => {
  const clock = document.getElementById('clock');
  clock.textContent = new Date().toLocaleTimeString();
  setInterval(() => clock.textContent = new Date().toLocaleTimeString(), 1000);
};

const initWebSocket = () => {
  const ws = new WebSocket(`ws://${location.host}`);

  ws.addEventListener('open', () => {
    console.log('WebSocket opened');
  });

  ws.addEventListener('message', e => {
    const buses = JSON.parse(e.data);
    renderBusData(buses);
  });

  ws.addEventListener('error', error => {
    console.log(`Websocket error: ${error}`);
  });

  ws.addEventListener('close', () => {
    console.log(`Websocket closed`);
  });
};


const init = async () => {
  const buses = await fetchBusData();
  renderBusData(buses);

  initWebSocket();

  currentTime();
};

init();