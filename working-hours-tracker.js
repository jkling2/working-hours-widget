// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: history;

// start of config ==========================

// sets the locale of the date
const locale = "de_DE";

// sets the name of the shortcut that redirects back to the homescreen (can be undefined)
const shortcutNameHomeScreen = "hs";

// when do you want to get the first notification on each day?
const startOfDayNotifTime = "07:30";

// break time
const breakOfDayNotifTime = "11:30";

// until when you want to get notifications
const endOfDayNotifTime = "15:30";

// working hours per day in h
const honestDayWork = 8;

// end of config ===========================

const WorkDayStates = {
	START: 0,
	BREAK: 1,
	END: 2,
	HONEST_DAY_WORK: 3
}

const DEFAULT_TIME = "00:00";
const dft = new DateFormatter();
dft.useShortTimeStyle();
const df = new DateFormatter();
df.useMediumDateStyle();
df.locale = locale;

const fm = FileManager.iCloud();
const dir = fm.joinPath(fm.documentsDirectory(), "working-hours");
const file = fm.joinPath(dir, "workinghours.json");
const data = fm.fileExists(file) ? JSON.parse(fm.readString(file)) : JSON.parse('[]');
const todaysDate = df.date(df.string(new Date()));
const dataToday = (data.length > 0 && sameDay(todaysDate, df.date(data[0].date))) ? data[0] : JSON.parse("{}");
const holidaysFile = fm.joinPath(dir, "holidays.json");
const holidays = fm.fileExists(holidaysFile) ? JSON.parse(fm.readString(holidaysFile)) : JSON.parse('[]');

let ui = new UITable();
ui.showSeparators = true;	
let row, cell, state;

if (isWorkDay() && args.queryParameters && args.queryParameters.update) {
	// build UI for updating data
	row = new UITableRow()
	row.isHeader = true;
	row.height = 60;
	row.addText("Update").centerAligned();
	ui.addRow(row);
	
	// row as spacer
	row = new UITableRow();
	row.height = 10;
	ui.addRow(row);
	
	row = new UITableRow();
	row.addText("Set start time").centerAligned();
	row.dismissOnSelect = false;
	row.onSelect = () => {
		state = WorkDayStates.START;
		askTime();
	};
	ui.addRow(row);
	
	row = new UITableRow();
	row.addText("Increase break time").centerAligned();
	row.dismissOnSelect = false;
	row.onSelect = () => {
		state = WorkDayStates.BREAK;
		updateAddTimeTable(true);
	};
	ui.addRow(row);
	
	row = new UITableRow();
	row.addText("Increase work time").centerAligned();
	row.dismissOnSelect = false;
	row.onSelect = () => {
		state = WorkDayStates.END;
		updateAddTimeTable(false);
	};
	ui.addRow(row);
	
	await ui.present();
	backToHomeScreen(shortcutNameHomeScreen);
	Script.complete();
} else if (config.runsInNotification || args.notification) {
	const notif = args.notification;
	state = notif.userInfo["workDay"];
	row = new UITableRow();
	row.height = 60;
	if (state !== WorkDayStates.HONEST_DAY_WORK) {
		row.addText(state === WorkDayStates.START ? "When did you start to work?" : state === WorkDayStates.BREAK ? "How long did you take a break?" : "When did you finish to work?").centerAligned();
		ui.addRow(row);
		
		// row as spacer
		row = new UITableRow();
		row.height = 10;
		ui.addRow(row);
		
		// create choices based on current time
		let choices = [];
		if (state === WorkDayStates.BREAK) {
			for (let i = 2; i <= 8; i++) {
				choices.push(i * 15);
			}
		} else {
			// round minutes down to quarter
			let choice = roundDateDownToQuarterMinutes(new Date());
			choice.setMinutes(choice.getMinutes() - 30);
			choices.push(dft.string(choice));
			for (let i = 1; i < 5; i++) {
				choice.setMinutes(choice.getMinutes() + 15);
				choices.push(dft.string(choice));
			}
		}
		
		choices.forEach((p) => {
			row = new UITableRow();
			row.height = 40;
			row.dismissOnSelect = !config.runsInNotification;
			row.onSelect = () => {
				ui.removeAllRows();
				row = new UITableRow();
				switch(state) {
					case WorkDayStates.START: {
						dataToday.start = p;
						row.addText(`Started at ${p}.`).centerAligned();
						break;
					}
					case WorkDayStates.BREAK: {
						dataToday.breakDuration = dataToday.breakDuration + p;
						row.addText(`Breaked for ${dataToday.breakDuration} min.`).centerAligned();
						break;
					}
					case WorkDayStates.END: {
						dataToday.end = p;
						row.addText(`Finished at ${p}.`).centerAligned();
						break;
					}
				}
				updateAndSave();
				ui.addRow(row);
				ui.reload();
			}
			row.addText(`${p}${state === WorkDayStates.BREAK ? " min" : ""}`).centerAligned();
			ui.addRow(row);
		});
		
		// row as spacer
		row = new UITableRow();
		row.height = 10;
		ui.addRow(row);
	
		// add choice to add individual time
		row = new UITableRow();
		row.height = 40;
		row.dismissOnSelect = false;
		switch(state) {
			case WorkDayStates.START: {
				row.onSelect = () => askTime();
				row.addText("Add individual start time").centerAligned();
				break;
			}
			case WorkDayStates.BREAK: {
				row.onSelect = () => askDuration(true);
				row.addText("Add individual break time").centerAligned();
				break;
			}
			case WorkDayStates.END: {
				row.onSelect = () => askTime();
				row.addText("Add individual finish time").centerAligned();
				break;
			}
		}
	} else {
		row.addText(`You worked for ${getCurrentWorkingHours()}h today.`).centerAligned();
    }
	ui.addRow(row);
	await ui.present();
	if (!config.runsInNotification) {
		if (fm.modificationDate(file).getTime() > notif.deliveryDate.getTime() || state === WorkDayStates.HONEST_DAY_WORK) {
			Notification.removeDelivered([notif.identifier]);
		}
		backToHomeScreen(shortcutNameHomeScreen);	
	} else if (state === WorkDayStates.HONEST_DAY_WORK) {
		Notification.removeDelivered([notif.identifier]);
	}
	Script.complete();
} else if (config.runsInApp || config.runsInWidget || config.runsFromHomeScreen) {
	// build widget
	let widget = new ListWidget();
	widget.backgroundColor = Color.lightGray()
	
	if (isWorkDay()) {
		// check if data for today exists and use it
		if (JSON.stringify(dataToday) === '{}') {
			// initialize data for today
			dataToday.date = df.string(todaysDate);
			dataToday.start = DEFAULT_TIME;
			dataToday.breakDuration = 0;
			dataToday.end = DEFAULT_TIME;
			data.unshift(dataToday);
			console.log(`added data for today: ${JSON.stringify(dataToday)}`);
			updateAndSave();
			// schedule notifications
			await createNotification(getDateTime(startOfDayNotifTime), "Start your work day 💻", WorkDayStates.START);
			await createNotification(getDateTime(breakOfDayNotifTime), "Take a break 🥨", WorkDayStates.BREAK);
			await createNotification(getDateTime(endOfDayNotifTime), "Finish your work day 💻", WorkDayStates.END);
		} else {
			let pendingHDWNotif = (await Notification.allPending()).filter(notif => notif.threadIdentifier === Script.name() && notif.userInfo.workDay === WorkDayStates.HONEST_DAY_WORK);
			let hdwNotifDate = getDateTime(dataToday.start);
			hdwNotifDate.setMinutes(hdwNotifDate.getMinutes() + (honestDayWork * 60) + dataToday.breakDuration);
			if (dataToday.start !== DEFAULT_TIME && dataToday.end === DEFAULT_TIME && pendingHDWNotif.length <= 0 && new Date().getTime() < hdwNotifDate.getTime()) {
				await createNotification(hdwNotifDate, "💻 Honest Day Work 🎉", WorkDayStates.HONEST_DAY_WORK);
			} else if (pendingHDWNotif.length >= 1) {
				pendingHDWNotif = pendingHDWNotif.filter(notif => dft.string(notif.nextTriggerDate) !== dft.string(hdwNotifDate));
				if (pendingHDWNotif.length > 0) {
					await Notification.removePending(pendingHDWNotif.map(notif => notif.identifier));
					await createNotification(hdwNotifDate, "💻 Honest Day Work 🎉", WorkDayStates.HONEST_DAY_WORK);
				}
			}
		}
		
	} else {
		dataToday.date = df.string(todaysDate);
		dataToday.start = DEFAULT_TIME;
		dataToday.breakDuration = 0;
		dataToday.end = DEFAULT_TIME;
	}
	
	// calculate working time and remaining working time for current month and current week, and working time for last 5 days
	let hoursWorkedMonth = hasCurrentWorkingHours() ? getCurrentWorkingHours() : 0;
	let pastMonth = getDataForPastNDays(31);
	for (let pastDay of pastMonth) {
		if (sameMonth(todaysDate, df.date(pastDay.date))) {
			hoursWorkedMonth += determineWorkingHours(pastDay);
		}
	}  
    let hoursMonth = determineWorkDaysMonth() * honestDayWork;
	let hoursWorkedWeek = hasCurrentWorkingHours() ? getCurrentWorkingHours() : 0;
	let hoursWorkedPastNDays = 0;
	let pastWeek = getDataForPastNDays(5);
	for (let pastDay of pastWeek) {
        let workingHoursPastDay = determineWorkingHours(pastDay);
		hoursWorkedPastNDays += workingHoursPastDay;
		if (sameWeek(todaysDate, df.date(pastDay.date))) {
			hoursWorkedWeek += workingHoursPastDay;
		}
	}  
    hoursWorkedPastNDays = hoursWorkedPastNDays / 5;
	
	// display calculated work hours
    let workingHoursMonthStack= widget.addStack();
    let workingHoursMonthText = workingHoursMonthStack.addText(`${todaysDate.toLocaleString('default', { month: 'short' })}: `);  
    workingHoursMonthText.minimumScaleFactor = 0.7;
	workingHoursMonthText = workingHoursMonthStack.addText(`${hoursWorkedMonth}/${hoursMonth}h`);  
    workingHoursMonthText.minimumScaleFactor = 0.7;
	if (hoursWorkedMonth >= hoursMonth) {
        workingHoursMonthText.textColor = Color.blue();
    }
	let workingHoursWeekStack= widget.addStack();
	workingHoursWeekStack.addText(`KW${getWeek(todaysDate)}: `);
	let workingHoursWeekText = workingHoursWeekStack.addText(`${hoursWorkedWeek}h`);  
    if (hoursWorkedWeek >= 5 * honestDayWork) {
        workingHoursWeekText.textColor = Color.blue();
    }
    let pastNDaysStack= widget.addStack();
	pastNDaysStack.addText("-5d: ");  
	let pastNDaysText = pastNDaysStack.addText(`${hoursWorkedPastNDays}h/d`);  
    pastNDaysText.textColor = hoursWorkedPastNDays < honestDayWork ? Color.orange() : Color.blue();
	
	// display current working time
	widget.addSpacer(10);
	widget.addText(`${todaysDate.toLocaleString('default', { weekday: 'short' })}, ${dataToday.date}`);
	widget.addSpacer(5);
	let currentWorkDay = "";
	if (dataToday.start !== DEFAULT_TIME){
		currentWorkDay += dataToday.start;
	}
	if (dataToday.breakDuration > 0){
		currentWorkDay += " -> " + dataToday.breakDuration;
	}
	if (dataToday.end !== DEFAULT_TIME){
		currentWorkDay += " -> " + dataToday.end;
	}
	let currentWorkDayText = widget.addText(currentWorkDay);  
    currentWorkDayText.textColor = Color.darkGray()
    currentWorkDayText.minimumScaleFactor = 0.5
    let contentStack = widget.addStack();
    if (hasCurrentWorkingHours()) {
        let currentWorkingHours = getCurrentWorkingHours();
        var textColor;  
        contentStack.addImage(SFSymbol.named("brain.head.profile").image);
        if (currentWorkingHours >= honestDayWork) {  
            contentStack.addImage(SFSymbol.named("clock.badge.checkmark").image);  
        textColor = Color.blue();
        } else {
            contentStack.addImage(SFSymbol.named("clock").image);
        textColor = Color.orange();
        }
        contentStack.addSpacer(5);
        contentStack.addText("=");
        contentStack.addSpacer(5);
    	let currentWorkingHoursText = contentStack.addText(currentWorkingHours.toString());  
        currentWorkingHoursText.textColor = textColor;  
        currentWorkingHoursText.shadowRadius = 0.5;
    } else {
        contentStack.addText("");
    }
	
	// run widget
	if (!config.runsInWidget) {
	  await widget.presentSmall();
	}
	Script.setWidget(widget);
	Script.complete();
}

// helper func

// rounds the given date down to full quarter minutes
function roundDateDownToQuarterMinutes(date) {
	date.setMinutes(roundMinutesDownToQuarter(date.getMinutes()));
    date.setSeconds(0);
	date.setMilliseconds(0);
	return date;
}

// rounds the given minutes down to full quarter minutes
function roundMinutesDownToQuarter(minutes) {
    return parseInt(minutes / 15) * 15;
}

// update and save data
function updateAndSave() {
	console.log(`saving data with ${data.length} entries`);
	data[0] = dataToday;
	fm.writeString(file, JSON.stringify(data));
}

// gets data for past n days
function getDataForPastNDays(n) {
	if (data.length > 0 && sameDay(todaysDate, df.date(data[0].date))) {
		return data.slice(1, n+1);
	}
	return data.slice(0, n);
}

// determines the working days for the current month
function determineWorkDaysMonth() {
  let workDaysMonth = 0;
  let lastDayMonth = df.date(df.string(todaysDate));
  lastDayMonth.setMonth(lastDayMonth.getMonth() + 1);
  lastDayMonth.setDate(0);
  let daysMonth = lastDayMonth.getDate();
  for (var i = 1; i <= daysMonth; i++) {    
    var date = df.date(df.string(todaysDate));
    date.setDate(i);
    if (isWorkDay(date)) {
       workDaysMonth++;
    }   
  }
  return workDaysMonth;
}

// determines the hours worked on a completed day
function determineWorkingHours(dataForDay) {
	return (diffMinutes(getDateTime(dataForDay.start), getDateTime(dataForDay.end)) - dataForDay.breakDuration) / 60;  
}

// determines if you started working on the current day
function hasCurrentWorkingHours() {
	return isWorkDay() && dataToday.start !== DEFAULT_TIME;
}

// determines the hours worked on the current day
function getCurrentWorkingHours() {
	return (diffMinutes(getDateTime(dataToday.start), (dataToday.end !== DEFAULT_TIME ? getDateTime(dataToday.end) : roundDateDownToQuarterMinutes(new Date()))) - dataToday.breakDuration) / 60;
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

// determines if two dates are in the same week
function sameWeek(first, second) {
	return ((first.getFullYear() === second.getFullYear()) &&
			(getWeek(first) === getWeek(second)));
}

// determines if two dates are in the same month
function sameMonth(first, second) {
	return ((first.getFullYear() === second.getFullYear()) &&
			(first.getMonth() === second.getMonth()));
}

// gets today with hours and minutes set to the given time
function getDateTime(formattedTime) {
	let d = df.date(df.string(todaysDate));
	d.setHours(dft.date(formattedTime).getHours());
	d.setMinutes(dft.date(formattedTime).getMinutes());
	return d;
}

// determines the week number for the given date
function getWeek(d) {
	var oneJan = new Date(d.getFullYear(), 0, 1);
	var numberOfDays = Math.floor((d - oneJan) / (24 * 60 * 60 * 1000));
	return Math.ceil((oneJan.getDay() + 1 + numberOfDays) / 7);
}

// determines if given date is a workday
function isWorkDay(d) {
	return isWeekDay(d || todaysDate) && !isHoliday(d || todaysDate);
}

// determines if given date is a weekday
function isWeekDay(d) {
	return ((d.getDay() > 0) // day 0 is sunday
		&& (d.getDay() < 6)); // day 6 is saturday
}

// determines if given date is a holiday
function isHoliday(d) {
	let isAHoliday = false;
    for (let holiday of holidays) {      
        if (holiday.end == null) {
            if (sameDay(d, df.date(holiday.start))) {
                isAHoliday = true;
                break;
            }
        } else {
            let start = df.date(holiday.start);
            let end = df.date(holiday.end);
            if (d.getTime() >= start.getTime() && d.getTime() <= end.getTime()) {
                isAHoliday = true;
                break;
            }
        }
    }
    return isAHoliday;
}

// creates a new table with times to select
function updateAddTimeTable(isBreak) {
	ui.removeAllRows();
	row = new UITableRow();
	row.isHeader = true;
	row.height = 60;
	row.addText(isBreak ? "Update break duration" : "Update finish time").centerAligned();
	ui.addRow(row);
	// row as spacer
	row = new UITableRow();
	row.height = 10;
	ui.addRow(row);
	// row to add predefined time (from 15 min to 2 hours)
	if (isBreak || dataToday.start !== DEFAULT_TIME) {
		for (let i = 1; i <= 8; i++) {
			let minutesToAdd = i * 15;
			row = new UITableRow();
			row.height = 40;
			row.dismissOnSelect = true;
			row.onSelect = () => {
				if (isBreak) {
					dataToday.breakDuration = dataToday.breakDuration + minutesToAdd;
				} else {
					let endTime = getDateTime(dataToday.end === DEFAULT_TIME ? dataToday.start : dataToday.end);
					endTime.setMinutes(endTime.getMinutes() + minutesToAdd);
					dataToday.end = dft.string(endTime);
				}
				updateAndSave();
			}
			row.addText("Add " + minutesToAdd + " min").centerAligned();
			ui.addRow(row);
		}
		// row as spacer
		row = new UITableRow();
		row.height = 10;
		ui.addRow(row);
	}
	// row to enter individual time
	row = new UITableRow();
	row.height = 40;
	row.dismissOnSelect = false;
	if (isBreak) {
		row.onSelect = () => askDuration(true);
		row.addText("Set individual break time").centerAligned();
	} else {
		row.onSelect = () => askDuration(true);
		row.addText("Set individual work time").centerAligned();
		ui.addRow(row);
		row = new UITableRow();
		row.height = 40;
		row.dismissOnSelect = false;
		row.onSelect = () => askTime();
		row.addText("Set individual finish time").centerAligned();
	}
	ui.addRow(row);
	ui.reload();
}

// Creates a UI for entering break duration
function askDuration(durationInMin, duration) {
	duration = duration || "";
	
	ui.removeAllRows();
	
	row = new UITableRow();
	row.isHeader = true;
	row.height = 60;
	row.addText(`Enter ${state === WorkDayStates.END ? "work" : "break"} duration. So far you ${state === WorkDayStates.END ? "worked" : "took a break"} for ${state === WorkDayStates.END ? getCurrentWorkingHours() * 60 : dataToday.breakDuration} min.`).centerAligned();
	ui.addRow(row);
	
	row = new UITableRow();
	ui.addRow(row);
	cell = row.addButton("min");
	cell.centerAligned();
	cell.onTap = () => {
		askDuration(true, duration);
	};
	cell = row.addButton("h");
	cell.centerAligned();
	cell.onTap = () => {
		askDuration(false, duration);
	};
	
	row = new UITableRow();
	ui.addRow(row);
	row.addText((duration || 0) + (durationInMin ? " min" : " h")).centerAligned();
	
	for (let i = 1; i <= 9; i++) {
		if (i % 3 === 1) {
			row = new UITableRow();
			ui.addRow(row);
		}
	
		let j = i;
		cell = row.addButton("" + i);
		cell.centerAligned();
		cell.onTap = () => {
			askDuration(durationInMin, "" + duration + j);
		};
	}
	
	row = new UITableRow();
	ui.addRow(row);
	
	cell = row.addButton(".");
	cell.centerAligned();
	cell.onTap = () => {
		askDuration(durationInMin, duration.indexOf(".") > 0 ? duration : (duration || 0) + ".");
	};
	
	cell = row.addButton("0");
	cell.centerAligned();
	cell.onTap = () => {
		askDuration(durationInMin, duration.length === 0 ? "" : (duration + "0"));
	};
	
	cell = row.addButton("⌫");
	cell.centerAligned();
	cell.onTap = () => {
		askDuration(durationInMin, duration.slice(0, -1));
	};
	
	row = new UITableRow();
	row.dismissOnSelect = !config.runsInNotification;
	row.onSelect = () => {
		ui.removeAllRows();
		row = new UITableRow();
		let timeToSave = roundMinutesDownToQuarter(duration * (durationInMin ? 1 : 60));
		if (state === WorkDayStates.BREAK) {
			dataToday.breakDuration = timeToSave;
			row.addText(`Breaked for ${dataToday.breakDuration} min.`).centerAligned();
		} else {
			if (dataToday.start === DEFAULT_TIME) {
				dataToday.start = startOfDayNotifTime;
				row.addText(`Started at ${dataToday.start}. `);
			}
			let finishTime = getDateTime(dataToday.start);
			finishTime.setMinutes(finishTime.getMinutes() + timeToSave + dataToday.breakDuration);
			dataToday.end = dft.string(finishTime);
			row.addText(`Finished at ${dataToday.end} (worked for ${timeToSave} min).`).centerAligned();
		}
		updateAndSave();
		ui.addRow(row);
		ui.reload();
	};
	row.addText("OK").centerAligned();
	ui.addRow(row);

	ui.reload();
}

// Creates a UI for entering start and finish time
function askTime(time) {
	if (state !== WorkDayStates.START && state !== WorkDayStates.END) {
		console.log(`wrong state for method: ${state}`);
		return;
	}
	time = time || "";
	let maxLength = 5;
	let correctFormat = !time || dft.date(time) !== null && time.length === maxLength;
	
	ui.removeAllRows();
	
	row = new UITableRow();
	row.isHeader = true;
	row.height = 60;
	row.addText(`Enter ${state === WorkDayStates.START ? "start" : "finish"} time (${dft.dateFormat}).`).centerAligned();
	ui.addRow(row);
	
	row = new UITableRow();
	ui.addRow(row);
	cell = row.addText(time || DEFAULT_TIME);
	cell.titleColor = correctFormat ? (!time ? Color.lightGray() : Color.green()) : Color.red();
	cell.centerAligned();
	
	for (let i = 1; i <= 9; i++) {
		if (i % 3 === 1) {
			row = new UITableRow();
			ui.addRow(row);
		}
	
		let j = i;
		cell = row.addButton("" + i);
		cell.centerAligned();
		cell.onTap = () => {
			askTime(("" + time + j).substring(0, maxLength));
		};
	}
	
	row = new UITableRow();
	ui.addRow(row);
	
	cell = row.addButton(":");
	cell.centerAligned();
	cell.onTap = () => {
		askTime(time.length === 2 ? time + ":" : time);
	};
	
	cell = row.addButton("0");
	cell.centerAligned();
	cell.onTap = () => {
		askTime((time + "0").substring(0, maxLength));
	};
	
	cell = row.addButton("⌫");
	cell.centerAligned();
	cell.onTap = () => {
		askTime(time.slice(0, -1));
	};
	
	row = new UITableRow();
 	row.dismissOnSelect = correctFormat && time !== DEFAULT_TIME && !config.runsInNotification;
	row.onSelect = () => {
		if (!correctFormat) {
			row = new UITableRow();
			cell = row.addText(`Incorrect time format. Expected ${dft.dateFormat}.`);
			cell.titleColor = Color.red();
			cell.centerAligned();
			ui.addRow(row);
			ui.reload();
		} else if (time === DEFAULT_TIME) {
			row = new UITableRow();
			cell = row.addText(`No time entered yet. Expected ${dft.dateFormat}.`);
			cell.titleColor = Color.red();
			cell.centerAligned();
			ui.addRow(row);
			ui.reload();
		} else {
			ui.removeAllRows();
			row = new UITableRow();
			let timeToSave = dft.string(roundDateDownToQuarterMinutes(getDateTime(time || DEFAULT_TIME)));
			if (state === WorkDayStates.START) {
				dataToday.start = timeToSave;
				row.addText(`Started at ${timeToSave}.`).centerAligned();
			} else {
				dataToday.end = timeToSave;
				row.addText(`Finished at ${timeToSave}.`).centerAligned();
			}
			updateAndSave();
			ui.addRow(row);
			ui.reload();
		}
	};
	row.addText("OK").centerAligned();
	ui.addRow(row);

	ui.reload();
}

// creates a new notification
async function createNotification(date, reason, workDayState) {
	console.log(`schedule notif on ${date.toLocaleString()} for ${reason}`)
	notif = new Notification();
	notif.title = Script.name();
	notif.body = reason.toString();
	notif.openURL = URLScheme.forRunningScript();
	notif.scriptName = Script.name();
	notif.sound = "popup";
	notif.threadIdentifier = Script.name();  
	notif.userInfo = {"workDay": workDayState}
	notif.setTriggerDate(date);  
	await notif.schedule();
}

// calls the shortcut with the name hs: shortcut to got back to the homescreen
function backToHomeScreen(shortcutNameHomeScreen) {
	if (shortcutNameHomeScreen) {
		Safari.open(`shortcuts://run-shortcut?name=${shortcutNameHomeScreen}`);
	}
}

