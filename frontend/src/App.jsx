import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import BloodRequest from "./pages/BloodRequest";
import MyBloodRequests from "./pages/MyBloodRequests";
import FindDonors from "./pages/FindDonors";
import BecomeDonor from "./pages/BecomeDonor";
import DonationRequests from "./pages/DonationRequests";
import Nutrition from "./pages/Nutrition";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Navigate to="/login" />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/blood-request"
          element={<BloodRequest />}
        />

        <Route
          path="/my-blood-requests"
          element={<MyBloodRequests />}
        />

        <Route
          path="/find-donors"
          element={<FindDonors />}
        />

        <Route
          path="/become-donor"
          element={<BecomeDonor />}
        />

        <Route
          path="/donation-requests"
          element={<DonationRequests />}
        />

        <Route
          path="/nutrition"
          element={<Nutrition />}
        />

        <Route
          path="*"
          element={<Navigate to="/login" />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;