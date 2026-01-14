# InsureAnalytics 📊

A powerful, privacy-first insurance analytics dashboard that runs entirely in your browser.

🔗 **Live Demo:** [https://insuredash.onrender.com/](https://insuredash.onrender.com/)

![InsureAnalytics Preview](https://img.shields.io/badge/Status-Live-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Features

- **📈 Premium Analytics** - Track Net Premium, Gross Premium, and Average Premium
- **📅 Renewal Tracking** - Never miss a renewal with upcoming due dates
- **🎯 Sales Targets** - Monitor all your sales targets at a glance
- **📱 Fully Responsive** - Works on desktop, tablet, and mobile
- **🔒 100% Private** - All data processing happens locally in your browser
- **⚡ Lightning Fast** - Instant file processing with Excel and CSV support

---

## 🚀 How to Use

1. Visit the [live demo](https://insuredash.onrender.com/)
2. Click **"Get Started"** or **"Upload File"**
3. Upload your Excel (.xlsx, .xls) or CSV file
4. View your insurance analytics instantly!

---

## 📋 Required Columns

Your file should have these column headers:

| Column Name | Required |
|-------------|----------|
| Client Name | ✅ Yes |
| Net Premium | ✅ Yes |
| Gross Premium | ✅ Yes |
| Policy No | ✅ Yes |
| Policy End Date | ✅ Yes |
| Policy Name | ❌ Optional |
| Next Premium Date | ❌ Optional |
| Sales Target | ❌ Optional |
| Insurer | ❌ Optional |

---

## 🛠️ Tech Stack

- **HTML5** - Structure
- **CSS3** - Premium dark UI with animations
- **JavaScript** - Client-side processing
- **SheetJS** - Excel/CSV parsing
- **IndexedDB** - Local data storage

---

## 📁 Project Structure

```
insuredash/
├── index.html      # Landing page
├── dashboard.html  # Analytics dashboard
├── styles.css      # Styling
├── app.js          # Main JavaScript
└── README.md       # This file
```

---

## 🔐 Privacy

Your data **never leaves your device**. All processing happens locally in your browser using JavaScript. No data is sent to any server.

---

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

Made with ❤️ for insurance professionals
