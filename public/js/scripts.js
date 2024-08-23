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
    console.log(nextDepartureDateTimeUTC);

    row.innerHTML = `
      <td>${bus.busNumber}</td>
      <td>${bus.startPoint} - ${bus.endPoint}</td>
      <td>${formatDate(nextDepartureDateTimeUTC)}</td>
      <td>${formatTime(nextDepartureDateTimeUTC)}</td>
    `;

    tableBody.append(row);
  });

  console.log(buses);
};

const init = async () => {
  const buses = await fetchBusData();
  renderBusData(buses);
};

init();