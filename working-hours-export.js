// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: table;

// start of config ==========================

// sets the locale of the date
const locale = "de_DE";

// the mail address to send mail to and from
const mailAddress = "jasmin.kling93@gmail.com";

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
const monthToExportStr = monthToExport.toLocaleString('default', { month: 'short' });

let fm = FileManager.iCloud();
let dir = fm.joinPath(fm.documentsDirectory(), "working-hours");
let file = fm.joinPath(dir, workingHoursFileName);
let data = fm.fileExists(file) ? JSON.parse(fm.readString(file)) : JSON.parse('[]');
let freeDaysFile = fm.joinPath(dir, "freeDays.json");
let freeDays = fm.fileExists(freeDaysFile) ? JSON.parse(fm.readString(freeDaysFile)) : JSON.parse('[]');
let fileMonth = fm.joinPath(dir, `workinghours${monthToExportStr}.csv`);

const csvSep = ';';
const newLine = '\n';
const header = `date${csvSep}start${csvSep}end${csvSep}break${csvSep}hours worked${csvSep}info`;
let monthlyDataStr = `${header}${newLine}`;
let workingDaysMonth = 0;
let workingHoursMonth = 0;
let startMonth = 0;
let endMonth = 0;
let breakMonth = 0;

let lastDayMonth = monthToExport;
lastDayMonth.setMonth(lastDayMonth.getMonth() + 1);
lastDayMonth.setDate(0);
let daysMonth = lastDayMonth.getDate();
let monthlyDataIdx = 0;
let monthlyData = getSortedDataForMonth(data, monthToExport, df);
// write one line per day in month
for (let dayInMonth = 1; dayInMonth <= daysMonth; dayInMonth++) {
	let d = monthToExport;
	d.setDate(dayInMonth);
	if (isHoliday(d)) {
		monthlyDataStr += `${df.string(d)}${csvSep}${csvSep}${csvSep}${csvSep}${csvSep}${getFreeDayName(d)}${newLine}`;		
	} else if (isWeekEnd(d)) {
		monthlyDataStr += `${df.string(d)}${csvSep}${csvSep}${csvSep}${csvSep}${csvSep}weekend${newLine}`;
	} else if (isVacation(d)) {
		monthlyDataStr += `${df.string(d)}${csvSep}08:00${csvSep}17:00${csvSep}1${csvSep}8${csvSep}${getFreeDayName(d)}${newLine}`;
	} else if (monthlyDataIdx >= monthlyData.length) {
		monthlyDataStr += `${df.string(d)}${csvSep}${csvSep}${csvSep}${csvSep}${csvSep}${newLine}`;
	} else {
		let sickDay = isSickDay(d) ? FreeDays.SICKDAY : "";
		let dateData = monthlyData[monthlyDataIdx];
		if (sameDay(d, df.date(dateData.date))) {
			let workingHours = determineWorkingHours(dateData, df, dft);
			let workingLocation = dateData.location ? dateData.location : "";
			let dateString = `${dateData.date}${csvSep}${dateData.start}${csvSep}${dateData.end}${csvSep}${(dateData.breakDuration/60).toLocaleString()}${csvSep}${workingHours.toLocaleString()}${csvSep}${workingLocation} ${sickDay}`;
			monthlyDataStr += `${dateString}${newLine}`;
			workingDaysMonth++;
			workingHoursMonth += workingHours;
			startMonth += convertDateTimeToMinutes(dateData.start);
			endMonth += convertDateTimeToMinutes(dateData.end);
			breakMonth += dateData.breakDuration;
			monthlyDataIdx++;
		} else {
			monthlyDataStr += `${df.string(d)}${csvSep}${csvSep}${csvSep}${csvSep}${csvSep}${sickDay}${newLine}`;
		}
	}
}

// add summary line
monthlyDataStr += `${workingDaysMonth}/${daysMonth}d${csvSep}${convertMinutesToDateTime(startMonth/workingDaysMonth)}${csvSep}${convertMinutesToDateTime(endMonth/workingDaysMonth)}${csvSep} ${parseInt(breakMonth/workingDaysMonth)}min/d${csvSep}${parseFloat((workingHoursMonth/workingDaysMonth).toPrecision(2)).toLocaleString()}h/d${csvSep}${workingHoursMonth}h`;
// write to file
fm.writeString(fileMonth, monthlyDataStr);
// prepare and send mail
let mail = new Mail();
mail.preferredSendingEmailAddress = mailAddress;
mail.toRecipients = [mailAddress];
mail.addFileAttachment(fileMonth);
mail.subject = `Your Working Hours for ${monthToExportStr}`;
mail.send();
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