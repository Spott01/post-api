function istToUtc(date, time = '00:00') {
  const [hour, minute] = time.split(':').map(Number);

  // Create IST date manually
  const istDate = new Date(`${date}T00:00:00`);
  istDate.setHours(hour, minute, 0, 0);

  // Convert IST → UTC (IST = UTC + 5:30)
  return new Date(istDate.getTime() - (5 * 60 + 30) * 60 * 1000);
}
module.exports = { istToUtc };
