// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: power-off;

const FreeDays = {
	SICKDAY: "sick",
	VACATION: "vacation",
	HOLIDAY: "holiday"
}

const df = new DateFormatter();
df.useMediumDateStyle()
df.locale="de_DE"

const fm = FileManager.iCloud();
const dir = fm.joinPath(fm.documentsDirectory(), "working-hours");
const freeDaysFile = fm.joinPath(dir, "freeDays.json");
const freeDays = fm.fileExists(freeDaysFile) ? JSON.parse(fm.readString(freeDaysFile)) : JSON.parse('[]');

let entry = JSON.parse("{}");

let checkmarkCircle = SFSymbol.named("checkmark.circle").image;
let checkmarkCircleFill = SFSymbol.named("checkmark.circle.fill").image;

let table = new UITable();
table.showSeparators = true;
entry.type = FreeDays.HOLIDAY;
populateTable(true);
table.present();

async function populateTable(isHoliday) {
	table.removeAllRows();
	
	// chose between holiday and vacation
	let row = new UITableRow();	
	let cell = row.addButton(isHoliday ? "Provide Vacation" : "Provide Holiday");
	cell.onTap = () => {
		entry.type = isHoliday ? FreeDays.HOLIDAY : FreeDays.VACATION;
		console.log(JSON.stringify(entry));
		populateTable(!isHoliday);
		table.reload();
	};
	cell.centerAligned();
	table.addRow(row);

	// header
	row = new UITableRow();
	row.height = 60;
	row.isHeader = true;
	row.dismissOnSelect = false;
	row.addText("Add new " + (isHoliday ? "Holiday" : "Vacation")).centerAligned();
	table.addRow(row);

	// row for name
	row = new UITableRow();
	row.dismissOnSelect = false;
	row.onSelect = () => alertForName(isHoliday, entry.name);
	cell = row.addButton("name");
	cell.onTap = () => alertForName(isHoliday, entry.name);
	let cellImageName = UITableCell.image(checkmarkCircle);
	if (entry.name) {
		row.addText(entry.name);
		cellImageName = UITableCell.image(checkmarkCircleFill);
	}
	cellImageName.rightAligned();
	row.addCell(cellImageName);
	table.addRow(row);

	// row for start date
	row = new UITableRow();
	row.dismissOnSelect = false;
	row.onSelect = () => pickDate(true, isHoliday, entry.start);
	cell = row.addButton("start");
	cell.onTap = () => pickDate(true, isHoliday, entry.start);
	let cellImageStart = UITableCell.image(checkmarkCircle);
	if (entry.start) {
		row.addText(entry.start);
		cellImageStart = UITableCell.image(checkmarkCircleFill);
	}
	cellImageStart.rightAligned();
	row.addCell(cellImageStart);
	table.addRow(row);

	// row for end date
	row = new UITableRow();
	row.dismissOnSelect = false;
	cell = row.addButton("end");
	cell.onTap = () => pickDate(false, isHoliday, entry.end);
	if (entry.end) {
		row.addText(entry.end);
		cell = row.addButton("❌");
		cell.onTap = () => {
			delete entry.end;
			console.log(JSON.stringify(entry));
			populateTable(isHoliday);
			table.reload();
		};
		cell.rightAligned();
	} else {
	}
	row.onSelect = () => pickDate(false, isHoliday, entry.end);
	table.addRow(row);
		
	let correctData = entry.name && entry.start;
	let startBeforeEnd = !entry.end || (entry.start && (df.date(entry.start) <= df.date(entry.end)));
	// row to save data
	row = new UITableRow();
	row.height = 60;
	table.addRow(row);
	cell = row.addButton("Save");
	cell.centerAligned();
	cell.onTap = () => {
		if (!correctData) {
			populateTable(isHoliday);
			row = new UITableRow();
			cell = row.addText("not enough data provided");
			cell.titleColor = Color.red();
			cell.centerAligned();
			table.addRow(row);
			table.reload();
		} else if (!startBeforeEnd) {
			populateTable(isHoliday);
			row = new UITableRow();
			cell = row.addText("provided start date is after end date");
			cell.titleColor = Color.red();
			cell.centerAligned();
			table.addRow(row);
			table.reload();
		} else {
			save();
			table.removeAllRows();
			let firstEntry = freeDays[0];
			row = new UITableRow();
			row.addText(`Saved ${firstEntry.type}`).centerAligned();
			table.addRow(row);
			row = new UITableRow();
			row.addText(`${firstEntry.name}`).centerAligned();
			table.addRow(row);
			row = new UITableRow();
			row.addText(`from ${firstEntry.start}`).centerAligned();
			table.addRow(row);
			if (firstEntry.end) {
				row = new UITableRow();
				row.addText(`to ${firstEntry.end}`).centerAligned();
				table.addRow(row);
			}
			table.reload();
		}
	}
}

async function pickDate(isStart, isHoliday, initialDate) {
	let dp = new DatePicker();
	if (initialDate) {
		dp.initialDate = df.date(initialDate);
	}
	let date = await dp.pickDate();
	if (isStart) {
		entry.start = df.string(date);		
	} else {
		entry.end = df.string(date);	
	}
	console.log(JSON.stringify(entry));
	populateTable(isHoliday);
	table.reload();
}

async function alertForName(isHoliday, initialName) {
	let alert = new Alert();
	if (initialName) {
		alert.addTextField(isHoliday ? "holiday name" : "vacation name", initialName);
	} else {
		alert.addTextField(isHoliday ? "holiday name" : "vacation name");
	}
	alert.addCancelAction("Cancel");
	alert.addDestructiveAction("Save");
	let presentedAlertIdx = await alert.presentAlert();
	if (presentedAlertIdx >= 0) {
		entry.name = alert.textFieldValue(0);
		console.log(JSON.stringify(entry));
		populateTable(isHoliday);
		table.reload();
	}
}


function save() {	
	console.log("Saved: " + JSON.stringify(entry));
	freeDays.unshift(entry);
	fm.writeString(freeDaysFile, JSON.stringify(freeDays));
}