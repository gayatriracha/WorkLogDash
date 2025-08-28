# Work Log Dashboard - Standalone Version

This is your work log dashboard converted to a standalone Streamlit application that you can run on your laptop.

## Installation Instructions

1. **Install Python 3.8 or higher** on your laptop if not already installed
2. **Create a new folder** for your work log dashboard
3. **Copy the files** `work_log_dashboard.py` to your folder
4. **Open terminal/command prompt** in that folder
5. **Install required packages**:
   ```bash
   pip install streamlit pandas plotly pytz
   ```

## Running the Dashboard

1. **Open terminal** in your work log folder
2. **Run the command**:
   ```bash
   streamlit run work_log_dashboard.py
   ```
3. **Your browser will open** automatically with the dashboard
4. **Start logging your work** from 2 PM to 11:30 PM IST

## Features

✅ **Time Slot Management** - All 11 time slots from 2 PM to 11:30 PM IST  
✅ **Real-time IST Clock** - Shows current time and active time slot  
✅ **Holiday Marking** - Mark entire days as holidays  
✅ **Auto-save** - All your entries are saved automatically  
✅ **Daily Progress** - Visual progress tracking and completion rates  
✅ **Monthly Statistics** - Productive hours, working days, and averages  
✅ **Work Area Analysis** - Automatic categorization of your work  
✅ **Data Visualization** - Hourly productivity charts  
✅ **Offline Storage** - All data stored locally in `work_logs.json`

## Data Storage

- Your work logs are saved in a `work_logs.json` file in the same folder
- The file is created automatically when you start logging
- You can backup this file to preserve your work history
- Data is stored locally on your laptop - no internet required after installation

## Usage Tips

- The dashboard highlights your current time slot in red when you're in work hours
- Completed time slots show with green checkmarks
- Monthly summary updates automatically as you log work
- You can navigate between dates using the sidebar date picker
- Work areas are automatically categorized based on keywords in your descriptions

## Customization

You can modify the `work_log_dashboard.py` file to:
- Change time slots or working hours
- Add custom work area categories
- Modify the color scheme
- Add new features or charts

Enjoy your productivity tracking!