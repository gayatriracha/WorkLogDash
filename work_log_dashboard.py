import streamlit as st
import pandas as pd
import json
import os
from datetime import datetime, time, timedelta
import pytz
from pathlib import Path
import plotly.express as px
import plotly.graph_objects as go

# Configure page
st.set_page_config(
    page_title="Work Log Dashboard",
    page_icon="🕐",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Time slots from 2 PM to 11:30 PM IST
TIME_SLOTS = [
    "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM",
    "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM", "11:30 PM"
]

# Data file path
DATA_FILE = Path("work_logs.json")

def load_data():
    """Load work logs from JSON file"""
    if DATA_FILE.exists():
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_data(data):
    """Save work logs to JSON file"""
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def get_ist_time():
    """Get current time in IST"""
    ist = pytz.timezone('Asia/Kolkata')
    return datetime.now(ist)

def get_current_time_slot():
    """Get current time slot based on IST time"""
    current_time = get_ist_time()
    hour = current_time.hour
    minute = current_time.minute
    
    if hour < 14 or hour > 23 or (hour == 23 and minute > 30):
        return None
    
    if hour == 23 and minute >= 30:
        return "11:30 PM"
    
    if hour >= 14 and hour <= 22:
        hour_12 = hour - 12 if hour > 12 else hour
        return f"{hour_12}:00 PM"
    
    return None

def is_work_hours():
    """Check if current time is within work hours"""
    current_time = get_ist_time()
    hour = current_time.hour
    minute = current_time.minute
    return (hour >= 14 and hour < 23) or (hour == 23 and minute <= 30)

def get_date_string(date_obj):
    """Convert date to string format"""
    return date_obj.strftime("%Y-%m-%d")

def calculate_monthly_summary(data, year, month):
    """Calculate monthly statistics"""
    month_key = f"{year}-{month:02d}"
    total_days = set()
    holiday_days = set()
    productive_hours = 0
    work_areas = {}
    
    for date_key, date_data in data.items():
        if date_key.startswith(month_key):
            total_days.add(date_key)
            
            if date_data.get('is_holiday', False):
                holiday_days.add(date_key)
                continue
            
            for slot, description in date_data.get('time_slots', {}).items():
                if description.strip():
                    productive_hours += 1 if slot != "11:30 PM" else 0.5
                    
                    # Categorize work areas
                    desc_lower = description.lower()
                    if 'frontend' in desc_lower or 'react' in desc_lower or 'ui' in desc_lower:
                        work_areas['Frontend'] = work_areas.get('Frontend', 0) + 1
                    elif 'backend' in desc_lower or 'api' in desc_lower or 'server' in desc_lower:
                        work_areas['Backend'] = work_areas.get('Backend', 0) + 1
                    elif 'meeting' in desc_lower or 'standup' in desc_lower:
                        work_areas['Meetings'] = work_areas.get('Meetings', 0) + 1
                    elif 'review' in desc_lower:
                        work_areas['Code Review'] = work_areas.get('Code Review', 0) + 1
                    elif 'documentation' in desc_lower or 'docs' in desc_lower:
                        work_areas['Documentation'] = work_areas.get('Documentation', 0) + 1
                    else:
                        work_areas['Other'] = work_areas.get('Other', 0) + 1
    
    working_days = len(total_days) - len(holiday_days)
    avg_hours = productive_hours / working_days if working_days > 0 else 0
    
    return {
        'total_days': len(total_days),
        'holiday_days': len(holiday_days),
        'working_days': working_days,
        'productive_hours': productive_hours,
        'avg_hours_per_day': round(avg_hours, 1),
        'work_areas': work_areas
    }

# Main app
def main():
    # Load data
    data = load_data()
    
    # Header
    col1, col2, col3 = st.columns([2, 1, 1])
    with col1:
        st.title("🕐 Work Log Dashboard")
        st.markdown("Track your daily productivity from 2 PM to 11:30 PM IST")
    
    with col2:
        current_time = get_ist_time()
        st.metric("Current Time (IST)", current_time.strftime("%I:%M %p"))
        
    with col3:
        current_slot = get_current_time_slot()
        if current_slot and is_work_hours():
            st.success(f"⏰ Current Slot: {current_slot}")
        elif is_work_hours():
            st.info("🔄 Work Hours Active")
        else:
            st.info("🌙 Outside Work Hours")
    
    # Sidebar
    with st.sidebar:
        st.header("Navigation")
        
        # Date selection
        selected_date = st.date_input(
            "Select Date",
            value=datetime.now().date(),
            help="Choose the date to view/edit work logs"
        )
        
        date_key = get_date_string(selected_date)
        
        # Holiday toggle
        is_holiday = st.checkbox(
            "Mark as Holiday",
            value=data.get(date_key, {}).get('is_holiday', False),
            help="Mark this entire day as a holiday"
        )
        
        # Update holiday status
        if date_key not in data:
            data[date_key] = {'time_slots': {}, 'is_holiday': False}
        data[date_key]['is_holiday'] = is_holiday
        save_data(data)
        
        st.divider()
        
        # Monthly summary
        st.subheader("📊 Monthly Summary")
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        summary = calculate_monthly_summary(data, current_year, current_month)
        
        st.metric("Productive Hours", f"{summary['productive_hours']:.1f}")
        st.metric("Working Days", f"{summary['working_days']}/{summary['total_days']}")
        st.metric("Avg Hours/Day", summary['avg_hours_per_day'])
        
        if summary['work_areas']:
            st.subheader("Top Work Areas")
            for area, hours in sorted(summary['work_areas'].items(), key=lambda x: x[1], reverse=True)[:3]:
                percentage = (hours / sum(summary['work_areas'].values())) * 100
                st.write(f"**{area}**: {percentage:.0f}%")
    
    # Main content
    if is_holiday:
        st.info(f"🏖️ {selected_date.strftime('%B %d, %Y')} is marked as a holiday")
        st.balloons()
    else:
        # Time slots grid
        st.subheader(f"📝 Work Log for {selected_date.strftime('%A, %B %d, %Y')}")
        
        # Initialize date data if not exists
        if date_key not in data:
            data[date_key] = {'time_slots': {}, 'is_holiday': False}
        
        # Create columns for time slots
        cols_per_row = 2
        slot_chunks = [TIME_SLOTS[i:i + cols_per_row] for i in range(0, len(TIME_SLOTS), cols_per_row)]
        
        for chunk in slot_chunks:
            cols = st.columns(len(chunk))
            
            for idx, time_slot in enumerate(chunk):
                with cols[idx]:
                    # Check if this is the current time slot
                    is_current = (
                        current_slot == time_slot and 
                        is_work_hours() and 
                        date_key == get_date_string(datetime.now().date())
                    )
                    
                    # Get existing description
                    existing_description = data[date_key]['time_slots'].get(time_slot, '')
                    
                    # Time slot header
                    if is_current:
                        st.markdown(f"### 🔥 {time_slot}")
                        st.markdown("*Current Hour*")
                    elif existing_description.strip():
                        st.markdown(f"### ✅ {time_slot}")
                    else:
                        st.markdown(f"### ⏰ {time_slot}")
                    
                    # Text area for work description
                    description = st.text_area(
                        f"Work Description",
                        value=existing_description,
                        height=100,
                        placeholder="What did you work on during this hour?",
                        key=f"{date_key}_{time_slot}",
                        label_visibility="collapsed"
                    )
                    
                    # Save description
                    data[date_key]['time_slots'][time_slot] = description
                    save_data(data)
        
        # Daily summary
        st.divider()
        st.subheader("📈 Daily Summary")
        
        daily_slots = data[date_key]['time_slots']
        completed_slots = [slot for slot, desc in daily_slots.items() if desc.strip()]
        total_slots = len(TIME_SLOTS)
        completion_rate = (len(completed_slots) / total_slots) * 100
        
        # Progress metrics
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Hours Logged", len(completed_slots))
        with col2:
            st.metric("Completion Rate", f"{completion_rate:.0f}%")
        with col3:
            remaining = total_slots - len(completed_slots)
            st.metric("Remaining Slots", remaining)
        
        # Progress bar
        st.progress(completion_rate / 100)
        
        # Work areas for the day
        if completed_slots:
            st.subheader("🏷️ Work Areas Covered Today")
            day_areas = {}
            for slot in completed_slots:
                desc = daily_slots[slot].lower()
                if 'frontend' in desc or 'react' in desc:
                    day_areas['Frontend'] = day_areas.get('Frontend', 0) + 1
                elif 'backend' in desc or 'api' in desc:
                    day_areas['Backend'] = day_areas.get('Backend', 0) + 1
                elif 'meeting' in desc:
                    day_areas['Meetings'] = day_areas.get('Meetings', 0) + 1
                elif 'review' in desc:
                    day_areas['Code Review'] = day_areas.get('Code Review', 0) + 1
                elif 'documentation' in desc:
                    day_areas['Documentation'] = day_areas.get('Documentation', 0) + 1
                else:
                    day_areas['Other'] = day_areas.get('Other', 0) + 1
            
            # Display work areas as badges
            area_cols = st.columns(len(day_areas))
            for idx, (area, count) in enumerate(day_areas.items()):
                with area_cols[idx]:
                    st.info(f"**{area}**: {count}h")
        
        # Visualization
        if len(completed_slots) > 0:
            st.subheader("📊 Hourly Productivity Visualization")
            
            # Create hourly chart
            chart_data = []
            for slot in TIME_SLOTS:
                status = "Completed" if slot in completed_slots else "Pending"
                chart_data.append({"Time Slot": slot, "Status": status, "Value": 1})
            
            df = pd.DataFrame(chart_data)
            
            fig = px.bar(
                df, 
                x="Time Slot", 
                y="Value",
                color="Status",
                title="Daily Work Log Status",
                color_discrete_map={"Completed": "#10b981", "Pending": "#e5e7eb"}
            )
            fig.update_layout(showlegend=True, height=400)
            st.plotly_chart(fig, use_container_width=True)

    # Footer
    st.divider()
    col1, col2, col3 = st.columns([1, 1, 1])
    with col2:
        st.markdown("*Work Log Dashboard - Track your productivity every hour*")

if __name__ == "__main__":
    main()