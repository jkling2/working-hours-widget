# :brain::clock1: working-hours-widget

This project provides a widget that tracks your working hours. It also supports a csv-export of your monthly working hours.

## Widget Design

## Functionality

## Requirements

* Apple Device with iOS 14.
* Scriptable latest (https://scriptable.app/).

## Setup

1. Copy the source code for ```working-hours-tracker.js``` ("raw").
2. Open Scriptable.
3. Select "+" and insert the copy of the script.
4. Choose the title of the script (e.g. Working Hours Tracker).
5. Save with "Done".
6. Go back to the iOS Homescreen and get into the "wiggle mode".
7. Press the "+" symbol and look for "Scriptable".
8. Choose widget size (small) and "Add widget".
9. Go into the settings of the widget to edit it.
   * Choose script of step #4.
   * Select when interacting "Open URL" and provide the URL Scheme of the script: e.g. `scriptable:///run/Working%20Hours%20Tracker?update=true`.

## Further Config Parameter

The top part of the script sets default config parameter. Those are:
* `locale`: Specifies the locale for formatting the current date
* `shortcutNameHomeScreen`: Specifies the name of the shortcut that redirects back to the homescreen. The shortcut must be created in addition, or it can be left empty/undefined.
* `startOfDayNotifTime`: Specifies the time of day when you want to be notified to start your work day
* `breakOfDayNotifTime`: Specifies the time of day when you want to be notified to take a break
* `endOfDayNotifTime`: Specifies the time of day when you want to be notified to finish your work day
* `honestDayWork`: Specifies the amount of hours you want to work per day

**Enjoy the widget!**
