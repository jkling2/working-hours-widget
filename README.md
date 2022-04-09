# :brain::clock1: working-hours-widget

This project provides a widget that tracks your working hours (`working-hours-tracker.js`), including your free days (e.g. vacations). It also supports a csv-export of your monthly working hours (`working-hours-export.js`).

## Widget Design

<img src="./img/widget_weekend_holiday.png" align="right" width="200" height="200">

The widget for tracking your working hours is divided into three parts.

The top part displays statistics about the current month, the current week and the past five working days:</br>
The first line displays the current month, the hours you worked (1st number) and the total hours you need to work (2nd number) during this month.</br>
The second line displays the current week and the hours you worked during this week.</br>
The third line displays your average daily working hours calculated over the last five working days.

The middle part displays today's day and date. For working from home or on weekends or sick days or during holidays or vacation, one of the following emoji is displayed: :house: (home), :tada: (weekends), :face_with_thermometer: (sick days), :christmas_tree: (holidays), :national_park: (vacation).

<img src="./img/widget_long_work.png" align="right" width="200" height="200">

And the bottom part shows information about the current working day. This information is only shown for working days. If the current day is a weekend, holiday or vacation, no data is shown.
Otherwise, the start time, break duration and finish time are, once provided, displayed in the first line. In the second/last line the current working hours are displayed. These are calculated based on the provided data. The current working hours are calculated once a start time is provided. If no finish time is provided, the current time is used to calculate the current working hours. Once a break duration is provided, it is subtracted from the current working hours.

The monthly, average daily and current working hours are color coded:
* Blue indicates that you reached or exceeded your needed working hours
* Orange indicates that you worked less than your needed working hours (not used for monthly working hours)

See the config parameter `honestDayWork` in [Tracker Config Parameter](https://github.com/jkling2/working-hours-widget#tracker-1) for setting your individual needed daily working hours. 

## Functionality

### Tracker

The working hours tracker tracks your daily working hours as precise as 15 minutes. A start/finish time or break duration that is not as precise as 15 minutes is rounded down to either the previous full quarter hour or the next smaller multiple of 15 (minutes). Tracking home office days is also supported.

Data about your daily working hours can be tracked in two different ways.

#### Via Notifications

<img src="./img/notification.png" align="right" width="200" height="100">

For each day three interactable notifications are scheduled and send at the provided notification times.
See the config parameters `startOfDayNotifTime`, `breakOfDayNotifTime`, `endOfDayNotifTime` in [Tracker Config Parameter](https://github.com/jkling2/working-hours-widget#tracker-1) for setting your individual notification times.

You can either long-press or click the notification to provide either your start time, break duration or finish time, depending on the notification you are interacting with.
The resulting UIs (via long-press or click) are identical. Furthermore, the structure of the UIs for providing either your start time, break duration or finish time are identical. A header informs you about the data you are changing. After that a few options are provided. Or you can enter an individual start/finish time or break duration. Individual start/finish time are checked for the correct format before they can be saved.

<img src="./img/notification_start_long_press.PNG" width="180" height="220">&nbsp;&nbsp;
<img src="./img/notification_start.png" width="180" height="360">&nbsp;&nbsp;
<img src="./img/notification_start_individual_time.PNG" width="180" height="360">&nbsp;&nbsp;
<img src="./img/notification_start_individual_time_wrong_format.PNG" width="180" height="360">

<img src="./img/notification_finish_long_press.PNG" width="180" height="220">&nbsp;&nbsp;
<img src="./img/notification_finish_long_press_individual_time.PNG" width="180" height="220">

<img src="./img/notification_break_long_press.png" width="180" height="220">&nbsp;&nbsp;
<img src="./img/notification_break_long_press_individual_time_h.PNG" width="180" height="220">&nbsp;&nbsp;
<img src="./img/notification_break_long_press_individual_time_min.PNG" width="180" height="220">&nbsp;&nbsp;
<img src="./img/notification_break_long_press_individual_time_min_entered.PNG" width="180" height="220">

If you are interacting with the notifiction via long-press, the saved data is displayed.
<img src="./img/notification_break_long_press_individual_time_min_ok.PNG" width="180" height="220">&nbsp;&nbsp;

#### Via Update

In order to use the update functionality, you have to configure your widget and use select when interacting "Open URL". See [Setup #9](https://github.com/jkling2/working-hours-widget#setup).

You can press the widget to reach the UI for updating your start time, break duration, finish time/work duration or for marking the day as a home office or sick day.
* You can set the start time by providing the start time in the format HH:mm.
* You can either add time to your current break duration or set it by providing your total break duration either in minutes or hours.
* You can either increase your work duration, or set it by providing your total work duration either in minutes or hours, or set your finish time by providing the finish time in the format HH:mm. The first option is only shown if a start time is already provided. The second option also sets the start time to the `startOfDayNotifTime` (see [Tracker Config Parameter](https://github.com/jkling2/working-hours-widget#tracker-1)) if no start time is given.
* You can mark the current day as a home office day by tapping the row `HomeOffice`.
* You can mark the current day as a sick day by tapping the row `Sick`.

<img src="./img/update.png" width="180" height="360">&nbsp;&nbsp;
<img src="./img/update_break.PNG" width="180" height="360">&nbsp;&nbsp;
<img src="./img/update_work_time.png" width="180" height="360">&nbsp;&nbsp;
<img src="./img/update_individual_work_time.png" width="180" height="360">

#### Holidays, vacation and sick days

Working hours are only tracked on work days. Work days are days that are neither weekends, holidays, vacation or sick days. Holidays, vacations and sick days can be provided in a separate file (`freeDays.json`). This file must be a list of JSON-Objects with the attributes `type`, `name`, `start` and `end` (optional). `type` can be either "sick day", "vacation" or "holiday".

```json
[
  { 
    "type": "name of vacation",
    "name": "name of holiday",
    "start": "dd.MM.JJJJ",
    "end": "dd.MM.JJJJ"
  },
  ...
]
```

Sick days can be entered via the update functionality (see [Tracker via Update](https://github.com/jkling2/working-hours-widget#via-update)).

<img src="./img/free-days.PNG" width="180" height="220">
For providing holidays and vacations use the script `working-hours-free-days.js`. It provides a UI for entering holidays and vacations. By clicking on the respective row, the holiday/vacation name, start and end date can be provided. The name and start fields are required. The end date is optional and can be deleted once entered (press :x:). It has to be after the start date. If this is not the case or the required fields are not filled, the entry cannot be saved. This is also controlled by the script. The message `not enough data provided` or `provided start date is after end date` is displyed in red. Once the entry was saved to file, the UI informs you about it.

<img src="./img/free-days_enter-name.PNG" width="180" height="360">&nbsp;&nbsp;
<img src="./img/free-days_enter-start.PNG" width="180" height="360">&nbsp;&nbsp;
<img src="./img/free-days_save-failed.PNG" width="180" height="360">&nbsp;&nbsp;
<img src="./img/free-days_saved.PNG" width="180" height="360">

### Export

The script (`working-hours-export.js`) for exporting your working hours currently only supports exporting the data for a single month. By default the current month will be exported, however, see [Export Config Parameter](https://github.com/jkling2/working-hours-widget#export-1) for individualizing the export.

The script generates a csv file containing the following columns: the date, the start time, the finiah time, the break duration and the hours worked. This data is generated for each day of the month, not just the working days. At the end, a final summary row is added: it provides the amount of working days for the month, the average starting time, the average finish time, the average break duration, the average hours worked per day, and the total hours worked per month.

### Planned Features

* export working hours for multiple month, or even a year

## Requirements

* Apple Device with iOS 14.
* Scriptable latest (https://scriptable.app/).

## Setup

1. Copy the source code for `working-hours-tracker.js` ("raw").
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
