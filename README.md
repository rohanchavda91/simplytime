# SimplyTime

A modern, elegant clock application built with AngularJS featuring digital and analog clock modes, stopwatch, timer, and alarm functionality.

## Features

- **Dual Clock Modes**: Switch between digital and analog displays with smooth animations
- **Stopwatch**: Start, pause, resume, and reset functionality with both digital and analog displays
- **Timer**: Set countdown timers with visual progress indicators
- **Alarms**: Set multiple alarms with custom labels
- **Glassmorphism UI**: Modern dark theme with blur effects and smooth animations
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## Technologies Used

- **AngularJS**: Frontend framework
- **CSS3**: Modern styling with glassmorphism effects
- **SVG**: Scalable vector graphics for analog clock faces
- **Web Audio API**: Alarm sounds and notifications

## Getting Started

1. Clone the repository
2. Open `index.html` in your web browser
3. No additional setup required - runs entirely in the browser

## Usage

- **Clock**: Toggle between digital and analog modes using the global toggle
- **Stopwatch**: Use the controls to start, pause, resume, or reset
- **Timer**: Set hours, minutes, and seconds, then start the countdown
- **Alarms**: Add custom alarms with time and optional labels

## File Structure

```
├── index.html          # Main application file
├── app.js              # AngularJS application logic
├── style.css           # Styles and animations
├── sounds/             # Audio files for alarms and timers
│   ├── alarm.mp3       # Alarm sound
│   ├── running.mp3     # Stopwatch running sound
│   ├── timer.mp3       # Timer countdown sound
│   └── tick-tock.wav   # Timer countdown sound
├── svg/                # SVG graphics and icons
│   ├── clock.svg       # Clock icon
│   ├── stopwatch.svg   # Stopwatch icon
│   ├── timer.svg       # Timer icon
│   └── alarm.svg       # Alarm icon
└── README.md           # This file
```

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## License

This project is open source and free to use for personal and commercial purposes.
