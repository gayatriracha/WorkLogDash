#!/usr/bin/env python3
"""
Simple Work Log Dashboard - No external dependencies required
Run with: python3 simple_work_log.py
"""

import json
import os
from datetime import datetime, timedelta
import webbrowser
import http.server
import socketserver
import threading
import time

# Configuration
PORT = 8080
DATA_FILE = "work_logs.json"
TIME_SLOTS = [
    "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM",
    "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM", "11:30 PM"
]

def load_data():
    """Load work logs from JSON file"""
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_data(data):
    """Save work logs to JSON file"""
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def get_ist_time():
    """Get current time in IST (assuming system time can be converted)"""
    # Simple IST calculation (UTC + 5:30)
    utc_now = datetime.utcnow()
    ist_now = utc_now + timedelta(hours=5, minutes=30)
    return ist_now

def get_current_time_slot():
    """Get current time slot"""
    ist_time = get_ist_time()
    hour = ist_time.hour
    minute = ist_time.minute
    
    if hour < 14 or hour > 23 or (hour == 23 and minute > 30):
        return None
    
    if hour == 23 and minute >= 30:
        return "11:30 PM"
    
    if 14 <= hour <= 22:
        hour_12 = hour - 12 if hour > 12 else hour
        return f"{hour_12}:00 PM"
    
    return None

def generate_html():
    """Generate HTML dashboard"""
    data = load_data()
    current_time = get_ist_time()
    current_slot = get_current_time_slot()
    today = current_time.strftime("%Y-%m-%d")
    
    # Get today's data
    today_data = data.get(today, {'time_slots': {}, 'is_holiday': False})
    
    # Calculate progress
    completed_slots = [slot for slot, desc in today_data['time_slots'].items() if desc.strip()]
    completion_rate = (len(completed_slots) / len(TIME_SLOTS)) * 100
    
    html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Work Log Dashboard</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            color: #334155;
            line-height: 1.6;
        }}
        .container {{ max-width: 1200px; margin: 0 auto; padding: 20px; }}
        .header {{ 
            background: white; 
            padding: 20px; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        .title {{ font-size: 28px; font-weight: 700; color: #1e293b; }}
        .subtitle {{ color: #64748b; font-size: 14px; }}
        .time-info {{ text-align: right; }}
        .current-time {{ font-size: 18px; font-weight: 600; color: #3b82f6; }}
        .current-slot {{ font-size: 14px; color: #10b981; }}
        
        .stats {{ 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
            margin-bottom: 20px; 
        }}
        .stat-card {{ 
            background: white; 
            padding: 20px; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }}
        .stat-title {{ font-size: 14px; color: #64748b; margin-bottom: 5px; }}
        .stat-value {{ font-size: 24px; font-weight: 700; color: #1e293b; }}
        
        .progress-bar {{ 
            width: 100%; 
            height: 10px; 
            background: #e2e8f0; 
            border-radius: 5px; 
            margin-top: 10px;
        }}
        .progress-fill {{ 
            height: 100%; 
            background: linear-gradient(90deg, #3b82f6, #10b981); 
            border-radius: 5px; 
            transition: width 0.3s ease;
        }}
        
        .time-slots {{ 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 20px; 
        }}
        .time-slot {{ 
            background: white; 
            padding: 20px; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.2s ease;
        }}
        .time-slot:hover {{ transform: translateY(-2px); }}
        .time-slot.current {{ border-left: 4px solid #3b82f6; background: #eff6ff; }}
        .time-slot.completed {{ border-left: 4px solid #10b981; }}
        .slot-header {{ 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 15px; 
        }}
        .slot-time {{ font-size: 16px; font-weight: 600; }}
        .slot-status {{ font-size: 20px; }}
        .completed {{ color: #10b981; }}
        .current-indicator {{ color: #3b82f6; }}
        .pending {{ color: #94a3b8; }}
        
        textarea {{ 
            width: 100%; 
            min-height: 80px; 
            padding: 10px; 
            border: 1px solid #d1d5db; 
            border-radius: 5px; 
            font-family: inherit;
            resize: vertical;
        }}
        textarea:focus {{ 
            outline: none; 
            border-color: #3b82f6; 
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); 
        }}
        
        .holiday-banner {{ 
            background: #fef3c7; 
            color: #92400e; 
            padding: 15px; 
            border-radius: 10px; 
            text-align: center; 
            margin-bottom: 20px; 
            font-weight: 600;
        }}
        
        .refresh-btn {{ 
            background: #3b82f6; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer; 
            font-size: 14px;
        }}
        .refresh-btn:hover {{ background: #2563eb; }}
        
        @media (max-width: 768px) {{
            .header {{ flex-direction: column; text-align: center; gap: 15px; }}
            .time-info {{ text-align: center; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <div class="title">🕐 Work Log Dashboard</div>
                <div class="subtitle">Track your productivity from 2 PM to 11:30 PM IST</div>
            </div>
            <div class="time-info">
                <div class="current-time">{current_time.strftime("%I:%M %p")} IST</div>
                <div class="current-slot">
                    {"🔥 Current: " + current_slot if current_slot else "🌙 Outside work hours"}
                </div>
                <button class="refresh-btn" onclick="location.reload()">Refresh</button>
            </div>
        </div>
        
        {"<div class='holiday-banner'>🏖️ Today is marked as a holiday</div>" if today_data['is_holiday'] else ""}
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-title">Hours Logged Today</div>
                <div class="stat-value">{len(completed_slots)}/{len(TIME_SLOTS)}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {completion_rate}%"></div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Completion Rate</div>
                <div class="stat-value">{completion_rate:.0f}%</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Date</div>
                <div class="stat-value">{current_time.strftime("%b %d")}</div>
            </div>
        </div>
        
        <div class="time-slots">
    """
    
    # Generate time slot cards
    for slot in TIME_SLOTS:
        description = today_data['time_slots'].get(slot, '')
        is_current = slot == current_slot
        is_completed = bool(description.strip())
        
        status_icon = "🔥" if is_current else "✅" if is_completed else "⏰"
        status_class = "current" if is_current else "completed" if is_completed else ""
        
        html += f"""
            <div class="time-slot {status_class}">
                <div class="slot-header">
                    <div class="slot-time">{slot}</div>
                    <div class="slot-status">{status_icon}</div>
                </div>
                <textarea 
                    placeholder="What did you work on during this hour?"
                    data-slot="{slot}"
                    onchange="saveWork(this)"
                >{description}</textarea>
            </div>
        """
    
    html += """
        </div>
    </div>
    
    <script>
        function saveWork(textarea) {
            const slot = textarea.getAttribute('data-slot');
            const description = textarea.value;
            
            // Save to localStorage as backup
            const today = new Date().toISOString().split('T')[0];
            let data = JSON.parse(localStorage.getItem('workLogs') || '{}');
            
            if (!data[today]) {
                data[today] = {time_slots: {}, is_holiday: false};
            }
            data[today].time_slots[slot] = description;
            
            localStorage.setItem('workLogs', JSON.stringify(data));
            
            // You can add server-side saving here if needed
            console.log('Saved work for', slot, ':', description);
        }
        
        // Auto-refresh every 5 minutes
        setTimeout(() => location.reload(), 300000);
    </script>
</body>
</html>
    """
    
    return html

class WorkLogHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            html = generate_html()
            self.wfile.write(html.encode())
        else:
            super().do_GET()

def start_server():
    """Start the local web server"""
    try:
        with socketserver.TCPServer(("", PORT), WorkLogHandler) as httpd:
            print(f"🚀 Work Log Dashboard running at: http://localhost:{PORT}")
            print(f"📁 Data will be saved to: {os.path.abspath(DATA_FILE)}")
            print("⏹️  Press Ctrl+C to stop the server")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\\n👋 Server stopped. Your work logs are saved!")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use. Try changing PORT in the script.")
        else:
            print(f"❌ Error starting server: {e}")

def main():
    """Main function"""
    print("🕐 Work Log Dashboard - Simple Version")
    print("=" * 50)
    
    # Start server in a separate thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # Give server time to start
    time.sleep(2)
    
    # Open browser
    try:
        webbrowser.open(f'http://localhost:{PORT}')
        print(f"🌐 Opening browser at http://localhost:{PORT}")
    except Exception as e:
        print(f"⚠️  Could not open browser automatically: {e}")
        print(f"📱 Manually open: http://localhost:{PORT}")
    
    # Keep main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\\n👋 Shutting down...")

if __name__ == "__main__":
    main()