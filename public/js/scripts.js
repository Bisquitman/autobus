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

const getTimeRemainingSeconds = (time) => {
  const now = new Date();
  const timeDiff = time - now;
  return Math.floor(timeDiff / 1000);
}

const renderBusData = (buses) => {
  const tableBody = document.querySelector("#bus tbody");
  tableBody.textContent = "";

  buses.forEach(bus => {
    const row = document.createElement("tr");
    const nextDepartureDateTimeUTC = new Date(`${bus.nextDeparture.date}T${bus.nextDeparture.time}Z`);

    const remainingSeconds = getTimeRemainingSeconds(nextDepartureDateTimeUTC);
    const remainingTimeText = remainingSeconds < 60 ? "<span style='color:red'>Отправляется</span>" : bus.nextDeparture.remaining;

    row.innerHTML = `
      <td>${bus.busNumber}</td>
      <td>${bus.startPoint} - ${bus.endPoint}</td>
      <td>${formatDate(nextDepartureDateTimeUTC)}</td>
      <td>${formatTime(nextDepartureDateTimeUTC)}</td>
      <td>${remainingTimeText}</td>
    `;

    tableBody.append(row);
  });
};

const updateTime = () => {
  const clockElement = document.getElementById('clock');
  clockElement.textContent = new Date().toLocaleTimeString();
  setTimeout(updateTime, 1000);
  // setInterval(() => clockElement.textContent = new Date().toLocaleTimeString(), 1000);
};

const initWebSocket = () => {
  const ws = new WebSocket(`wss://${location.host}`);

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
  updateTime();
};

init();