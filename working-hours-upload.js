// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: table;

// start of config ==========================

// sets the locale of the date
const locale = "de_DE";

// employee id
const id = 99
// employee name
const name = "Kling, Jasmin"
// default working hours
const defaultWorkingHours = 8;
const defaultStart = "08:00:00";
const defaultEnd = "17:00:00";
const defaultBreak = "1";

const vacationAccountMain = "BCXP-SONDER"
const vacationAccountSub = "URLAUB"
const sickAccountMain = "BCXP-SONDER"
const sickAccountSub = "KRANK"

// sets the month for which data is exported - default is current month - valid numbers from 0 to 11
const monthToExportNr = new Date().getMonth();
// specifies the file name containing the working hours
const workingHoursFileName = "workinghours.json";

// end of config ===========================

const FreeDays = {
	SICKDAY: "sick day",
	VACATION: "vacation",
	HOLIDAY: "holiday"
}

const dft = new DateFormatter();
dft.useShortTimeStyle();
const df = new DateFormatter();
df.useMediumDateStyle();
df.locale = locale;

let monthToExport = df.date(df.string(new Date()));
monthToExport.setMonth(monthToExportNr);
const monthToExportStr = monthToExport.toLocaleString('default', { month: 'short' }) + monthToExport.toLocaleString('default', { year: 'numeric' })
console.log(monthToExportStr)
let fm = FileManager.iCloud();
let dir = fm.joinPath(fm.documentsDirectory(), "working-hours");
let file = fm.joinPath(dir, workingHoursFileName);
let data = fm.fileExists(file) ? JSON.parse(fm.readString(file)) : JSON.parse('[]');
let freeDaysFile = fm.joinPath(dir, "freeDays.json");
let freeDays = fm.fileExists(freeDaysFile) ? JSON.parse(fm.readString(freeDaysFile)) : JSON.parse('[]');
let fileMonth = fm.joinPath(dir, `workinghours${monthToExportStr}.json`);

// initialize empty json
let monthlyDataJSON = JSON.parse("{}");
// add data to identify employee, current month, ...
monthlyDataJSON.id = `${id}`;
monthlyDataJSON.jahr = monthToExport.toLocaleString('default', { year: 'numeric' });
monthlyDataJSON.monat = monthToExport.toLocaleString('default', { month: 'numeric' });
monthlyDataJSON.name = name;
monthlyDataJSON.release = "false";
monthlyDataJSON.auszahlungswunsch = "0";
monthlyDataJSON.tage = JSON.parse("[]");

let lastDayMonth = monthToExport;
lastDayMonth.setDate(1);
lastDayMonth.setMonth(lastDayMonth.getMonth() + 1);
lastDayMonth.setDate(0);
let daysMonth = lastDayMonth.getDate();
let monthlyDataIdx = 0;
let monthlyData = getSortedDataForMonth(data, monthToExport, df);
// write one line per day in month
for (let dayInMonth = 1; dayInMonth <= daysMonth; dayInMonth++) {
	let d = monthToExport;
	d.setDate(dayInMonth);
	let dayDataJSON = JSON.parse("{}");
	dayDataJSON.tag = `${dayInMonth}`;
	if (monthlyDataIdx >= monthlyData.length || isHoliday(d) || isWeekEnd(d)) {
		// store empty data entry
		dayDataJSON.beginn = "";
		dayDataJSON.ende = "";
		dayDataJSON.pause = "";
	} else if (isVacation(d)) {
		// store default working hours in vacation account
		dayDataJSON.beginn = defaultStart;
		dayDataJSON.ende = defaultEnd;
		dayDataJSON.pause = defaultBreak;
		let dayDataBookingsJSON = JSON.parse("[]");
		let dayDataBookingsVacationJSON = JSON.parse("{}");
		dayDataBookingsVacationJSON.haupt = vacationAccountMain;
		dayDataBookingsVacationJSON.unter = vacationAccountSub;
		dayDataBookingsVacationJSON.zeit = defaultWorkingHours;
		dayDataBookingsJSON.push(dayDataBookingsVacationJSON);
		dayDataJSON.buchungen = dayDataBookingsJSON;
	} else {
		let sickDay = isSickDay(d);
		let workingHours = 0;
		let dateData = monthlyData[monthlyDataIdx];
		let dayDataBookingsJSON = JSON.parse("[]");
		let dayDataCommentsJSON = JSON.parse("[]");
		if (sameDay(d, df.date(dateData.date))) {
			workingHours = determineWorkingHours(dateData, df, dft);
			if (!sickDay) {
				dayDataJSON.beginn = `${dateData.start}:00`;
				dayDataJSON.ende = `${dateData.end}:00`;
				dayDataJSON.pause = `${(dateData.breakDuration/60).toLocaleString()}`;
			}
			// book working hours to work account
			if (JSON.stringify(dateData.bookings) !== undefined) {
				for (let bookingEntry of dateData.bookings) {
					// add booking entry
					let dayDataBookingsEntryJSON = JSON.parse("{}");
					dayDataBookingsEntryJSON.haupt = bookingEntry.accountMain;
					dayDataBookingsEntryJSON.unter = bookingEntry.accountSub;
					dayDataBookingsEntryJSON.zeit = bookingEntry.time;
					dayDataBookingsJSON.push(dayDataBookingsEntryJSON);
					// add comment entry
					let dayDataCommentsEntryJSON = JSON.parse("{}");
					dayDataCommentsEntryJSON.haupt = bookingEntry.accountMain;
					dayDataCommentsEntryJSON.unter = bookingEntry.accountSub;
					dayDataCommentsEntryJSON.bemerkung = bookingEntry.comment;
					dayDataCommentsJSON.push(dayDataCommentsEntryJSON);
				}
			}
			monthlyDataIdx++;
		}
		if (sickDay) {
			// sick day => store default working hours in sick account
			dayDataJSON.beginn = defaultStart;
			dayDataJSON.ende = defaultEnd;
			dayDataJSON.pause = defaultBreak;
			if (defaultWorkingHours - workingHours > 0) {
				let remainingSickHours = defaultWorkingHours - workingHours;
				let dayDataBookingsSickJSON = JSON.parse("{}");
				dayDataBookingsSickJSON.haupt = sickAccountMain;
				dayDataBookingsSickJSON.unter = sickAccountSub;
				dayDataBookingsSickJSON.zeit = remainingSickHours;
				dayDataBookingsJSON.push(dayDataBookingsSickJSON);
			}
		}
		dayDataJSON.buchungen = dayDataBookingsJSON;
		dayDataJSON.bemerkungen = dayDataCommentsJSON;
	}
	monthlyDataJSON.tage.push(dayDataJSON);
}

// write to file
fm.writeString(fileMonth, JSON.stringify(monthlyDataJSON));

// TODO: upload data to API

Script.complete();

// helper func

// determines if given date is a weekend
function isWeekEnd(d) {
	return ((d.getDay() === 0) // day 0 is sunday
		|| (d.getDay() === 6)); // day 6 is saturday
}

// determines if the given date is a free day (sick, vacation or holiday)
function isFreeDay(d) {
	return isSickDay(d) || isVacation(d) || isHoliday(d);
}

// determines the type of free day for the given date (sick, vacation or holiday)
function getFreeDay(d) {
	if (isSickDay(d)) {
		FreeDays.SICKDAY;
	} else if (isVacation(d)) {
		FreeDays.VACATION;
	} else if (isHoliday(d)) {
		FreeDays.HOLIDAY;
	} else {
		return "";
	}
}

// determines the name of the free day for the given date
function getFreeDayName(d) {	
	for (let entry of freeDays) {   
		if (entry.end == null) {
			if (sameDay(d, df.date(entry.start))) {
				return entry.name;
			}
		} else {
			let start = df.date(entry.start);
			let end = df.date(entry.end);
			if (d.getTime() >= start.getTime() && d.getTime() <= end.getTime()) {
				return entry.name;
			}
		}
    }
    return "";
}

// determines if the given date is a sick day
function isSickDay(d) {
	return checkFreeDay(d, FreeDays.SICKDAY);
}

// determines if the given date is a vacation
function isVacation(d) {
	return checkFreeDay(d, FreeDays.VACATION);
}

// determines if the given date is a holiday
function isHoliday(d) {
	return checkFreeDay(d, FreeDays.HOLIDAY);
}

// checks if the given date is a free day of the provided type
function checkFreeDay(d, freeDay) {
	let isAFreeDay = false;
    for (let entry of freeDays) {   
		if (entry.type === freeDay) {
			if (entry.end == null) {
				if (sameDay((d || todaysDate), df.date(entry.start))) {
					isAFreeDay = true;
					break;
				}
			} else {
				let start = df.date(entry.start);
				let end = df.date(entry.end);
				if ((d || todaysDate).getTime() >= start.getTime() && (d || todaysDate).getTime() <= end.getTime()) {
					isAFreeDay = true;
					break;
				}
			}
		}
    }
    return isAFreeDay;
}

// extracts the data for the given month and sorts the data in ascending order
function getSortedDataForMonth(data, monthToExport, df) {
	let sortedDataForMonth = [];
	for (let dataEntry of data) {
		if (sameMonth(monthToExport, df.date(dataEntry.date))) {
			sortedDataForMonth.push(dataEntry);
		}
	}
	sortedDataForMonth.sort((d1, d2) => df.date(d1.date).getTime() - df.date(d2.date).getTime());		
	return sortedDataForMonth;
}

// determines the hours worked on a completed day
function determineWorkingHours(dataForDay, df, dft) {
	return (diffMinutes(getDateTime(df.date(dataForDay.date), dft, dataForDay.start), getDateTime(df.date(dataForDay.date), dft, dataForDay.end)) - dataForDay.breakDuration) / 60;  
}

// determines the difference in minutes between 2 dates
function diffMinutes(first, second) {
	var diff =((second.getTime() - first.getTime()) / 1000) / 60;
	return Math.abs(Math.round(diff));
}

// determines if two dates are on the same day
function sameDay(first, second) {
    return ((first.getFullYear() === second.getFullYear()) &&
			(first.getMonth() === second.getMonth()) &&
			(first.getDate() === second.getDate()));
}

// determines if two dates are in the same month
function sameMonth(first, second) {
	return ((first.getFullYear() === second.getFullYear()) &&
			(first.getMonth() === second.getMonth()));
}

// gets today with hours and minutes set to the given time
function getDateTime(date, dft, formattedTime) {
	let d = date;
	d.setHours(dft.date(formattedTime).getHours());
	d.setMinutes(dft.date(formattedTime).getMinutes());
	return d;
}

// converts the given dateTime string to minutes
function convertDateTimeToMinutes(dateTime) {
  return parseInt(dateTime.split(":")[0]) * 60 + parseInt(dateTime.split(":")[1]);
}

// converts the given minutes to a dateTime string (with leading zero)
function convertMinutesToDateTime(minutes) {
  let hours = parseInt((minutes / 60).toString());
  let mins = parseInt((minutes % 60).toString());
  return hours + ":" + (mins < 10 ? "0" + mins : mins);
}