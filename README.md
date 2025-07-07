# smartShopper

## Smart Grocery Deal Finder

`smartShopper` is an intelligent mobile application designed to help users find the best deals on groceries in their local area. By leveraging AI, it identifies the lowest prices on user-selected products from various supermarkets, focusing on "food waste" or clearance sales to maximize savings.

## Features (MVP)

- **Product Selection:** Users select groceries they need from a predefined list.
- **Location-Based Search:** Find deals based on the user's Danish zip code.
- **AI-Powered Deal Matching:** Utilizes Google's Gemini LLM to intelligently match user-selected products with available clearance offers from supermarkets.
- **Best Price Identification:** Displays the lowest price and store for each selected product.
- **Cross-Platform (iOS First):** Built with React Native for future Android compatibility.

## Technologies Used

### Backend (Node.js / Express.js)

- **Node.js:** JavaScript runtime.
- **Express.js:** Web application framework for the API.
- **Axios:** HTTP client for external API calls.
- **Google Gemini LLM:** Powers the intelligent product matching and deal comparison.
- `node-cache`: In-memory caching for API responses.
- `dotenv`: Environment variable management.

### Frontend (React Native / Expo)

- **React Native:** Framework for building native mobile apps using React.
- **Expo:** Toolchain for simplified React Native development, build, and deployment.
- **TypeScript:** For type safety and improved developer experience.
- `react-native-web`: For web preview/development.

## Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm (comes with Node.js)
- Xcode (for iOS development and simulator)
- A Google Gemini API Key

### Setup

1. **Clone the repository:**

```bash
git clone <your-repo-url>
cd smartShopper
```

2. **Backend Setup:**

Navigate to the backend directory:

```bash
cd backend
```

Create a `.env` file and add your API keys:

```
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
PORT=3000
```

Install dependencies:

```bash
npm install
```

Start the backend server:

```bash
npm start
```

(The server will listen on `http://localhost:3000/api`)

3. **Frontend Setup:**

Open a **new terminal** and navigate to the frontend directory:

```bash
cd ../frontend
```

Install dependencies (including web support):

```bash
npm install
npx expo install react-dom react-native-web @expo/metro-runtime
```

**Configure API Base URL:**

- Open `src/services/apiService.ts`.
- Set `API_BASE_URL` to `http://localhost:3000/api` for simulator/web testing.
- _(If testing on a physical device, replace `localhost` with your computer's local IP address, e.g., `http://192.168.1.100:3000/api`)_

Start the Expo development server (forcing `localhost` for simulator compatibility):

```bash
npx expo start --host localhost
```

## Running the App

### On iOS Simulator:

1. Ensure an iOS Simulator is running (open Xcode > Window > Devices and Simulators > Simulators tab, then click `+` to create one if needed, then run it).
2. In the terminal where `npx expo start` is running, press `i`.

### In Web Browser:

1. In the terminal where `npx expo start` is running, press `w`.
2. Alternatively, in the Expo Dev Tools page (opened in your browser), click "Run in web browser".

## Debugging

- **Backend:** Check the terminal where your backend is running for logs. Raw API responses and LLM inputs/outputs are saved in `backend/debug_data/`.
- **Frontend (VS Code):** Install the "React Native Tools" extension. Use the "Debug Expo" launch configuration in `.vscode/launch.json`.
- **Frontend (Browser):** Use your browser's developer console.

## Future Enhancements

- User authentication and profiles.
- Personalized shopping lists and historical data.
- Optimization for fewest store stops.
- Integration with more daniash supermarkets (e.g., Rema 1000, Lidl).
- Compatibility with Android.
