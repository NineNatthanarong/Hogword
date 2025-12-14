# HogWord Frontend

Next.js 16 frontend application for the HogWord English sentence practice platform.

## 🚀 Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Charts:** Recharts
- **Icons:** Lucide React
- **Animations:** Framer Motion

## 📦 Installation

```bash
npm install
```

## 🛠️ Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏗️ Build

Build for production:

```bash
npm run build
```

Start production server:

```bash
npm start
```

## 📝 Project Structure

```
app/
├── page.tsx              # Login/Registration page
├── challenge/
│   └── page.tsx         # Word challenge interface
├── summary/
│   └── page.tsx         # Analytics dashboard
└── globals.css          # Global styles
```

## 🌐 API Integration

The frontend connects to the FastAPI backend. Configure the API URL in your environment variables or directly in the fetch calls.

## 📄 License

Part of the AIE312 Final Project.
