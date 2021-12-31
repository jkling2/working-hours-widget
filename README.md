# :brain::clock1: working-hours-widget

This project provides a widget that tracks your working hours (`working-hours-tracker.js`). It also supports a csv-export of your monthly working hours (`working-hours-export.js`).

## Widget Design

TODO

## Functionality

### Tracker

TODO: describe expected format of holidays.json -> possibly change to differentiate between holiday, vacation and sick days

### Export

The script for exporting your working hours currently only supports exporting the data for a single month. By default the current month will be exported, however, see [Export Config Parameter](https://github.com/jkling2/working-hours-widget#further%20config%20parameter#export) for individualizing the export.

The script generates a csv file containing the following columns: the date, the start time, the finiah time, the break duration and the hours worked. This data is generated for each day of the month, not just the working days. At the end, a final summary row is added: it provides the amount of working days for the month, the average starting time, the average finish time, the average break duration, the average hours worked per day, and the total hours worked per month.

### Planned Features

* export working hours for multiple month, or even a year
* in the csv file: provide reason for empty rows, e.g. week end, holiday, vacation
* track and export working location
* enable entering and tracking sick days
* enable entering holidays and vacation

## Requirements

* Apple Device with iOS 14.
* Scriptable latest (https://scriptable.app/).

## Setup

1. Copy the source code for `working-hours-tracker.js` ("raw") or `working-hours-export.js` ("raw").
2. Open Scriptable.
3. Select "+" and insert the copy of the script.
4. Choose the title of the script (e.g. Working Hours Tracker or Working Hours Export).
5. Save with "Done".
6. Go back to the iOS Homescreen and get into the "wiggle mode".
7. Press the "+" symbol and look for "Scriptable".
8. Choose widget size (small) and "Add widget".
9. Go into the settings of the widget to edit it.
   * Choose script of step #4.
   * For the Tracker: select when interacting "Open URL" and provide the URL Scheme of the script: e.g. `scriptable:///run/Working%20Hours%20Tracker?update=true`.

## Further Config Parameter

### Tracker

The top part of the script sets default config parameter. Those are:
* `locale`: Specifies the locale for formatting the current date
* `shortcutNameHomeScreen`: Specifies the name of the shortcut that redirects back to the homescreen. The shortcut must be created in addition, or it can be left empty/undefined.
* `startOfDayNotifTime`: Specifies the time of day when you want to be notified to start your work day
* `breakOfDayNotifTime`: Specifies the time of day when you want to be notified to take a break
* `endOfDayNotifTime`: Specifies the time of day when you want to be notified to finish your work day
* `honestDayWork`: Specifies the amount of hours you want to work per day

### Export

The top part of the script sets default config parameter. Those are:
* `locale`: Specifies the locale for formatting the current date
* `mailAddress`: Specifies the sender and receiver mail address
* `monthToExportNr`: Specifies the number of the month to export (0=January, ..., 11=December)

**Enjoy the widget!**
