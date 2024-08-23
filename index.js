import 'dotenv/config';
import express from 'express';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import url from "node:url";
import {DateTime} from 'luxon';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const timeZone = "UTC";
const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

const loadBuses = async () => {
  const data = await readFile(path.join(__dirname, 'buses.json'), {encoding: 'utf8'});
  return JSON.parse(data);
};

const getNextDeparture = (firstDepartureTime, frequencyMinutes) => {
  // now - текущее время в установленном часовом поясе (timeZone)
  const now = DateTime.now().setZone(timeZone);
  const [hours, minutes] = firstDepartureTime.split(':').map(Number);

  // departure - время отправки автобуса, для начала - первое (взятое из firstDepartureTime)
  let departure = DateTime
    .now()
    .set({hours: hours, minutes: minutes, seconds: 0})
    .setZone(timeZone);

  // endOfDay - конец дня
  const endOfDay = DateTime
    .now()
    .set({hours: 23, minutes: 59, seconds: 59})
    .setZone(timeZone);

  if (departure < now) {
    departure = departure.plus({ minutes: frequencyMinutes });
  }

  if (departure > endOfDay) {
    departure = departure
      .startOf('day')
      .plus({days: 1})
      .set({hours: hours, minutes: minutes, seconds: 0});
  }

  while (departure < now) {
    departure = departure.plus({ minutes: frequencyMinutes });

    if (departure > endOfDay) {
      departure = departure
        .startOf('day')
        .plus({days: 1})
        .set({hours: hours, minutes: minutes, seconds: 0});
    }
  }

  return departure;
};

const sendUpdatedData = async () => {
  const buses = await loadBuses();

  return buses.map((bus) => {
    const nextDeparture = getNextDeparture(bus.firstDepartureTime, bus.frequencyMinutes);

    return {
      ...bus,
      nextDeparture: {
        date: nextDeparture.toFormat("yyyy-MM-dd"),
        time: nextDeparture.toFormat("HH:mm"),
      }
    };
  });
};

const sortBuses = (buses) => {
  // [...buses] - такая конструкция создаёт копию массива buses
  return [...buses].sort((a, b) => {
    const dateA = new Date(`${a.nextDeparture.date}T${a.nextDeparture.time}`);
    const dateB = new Date(`${b.nextDeparture.date}T${b.nextDeparture.time}`);

    return dateA - dateB;
  });
}

app.get('/next-departure', async (req, res) => {
  try {
    const updatedBuses = await sendUpdatedData();
    const sortedBuses = sortBuses(updatedBuses);
    // console.table(updatedBuses);

    res.json(sortedBuses);
  } catch (e) {
    res.status(500).send({status: 500, message: `500 "Internal server error". ${e.message}`});
    console.error(`500 "Internal server error"\n${e.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`The server is started on port: ${PORT}`);
});