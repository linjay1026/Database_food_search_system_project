// App.jsx
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import RestaurantSearch from "./RestaurantSearch";
import RestaurantDetail from "./RestaurantDetail";
import LoginPage from "./loginpage";
import RegisterPage from "./Registerpage";
import FavoritePage from "./FavoritePage";
import Footer from "./Footer";
import ScrollToTop from "./ScrollToTop";
import OwnerDashboard from "./OwnerDashboard";

export default function App() {
  const [user, setUser] = useState(null); // username
  const [role, setRole] = useState(null); // user role

  // 頁面載入時讀取 localStorage
  useEffect(() => {
    const storedUsername = localStorage.getItem("loggedInUsername");
    const storedRole = localStorage.getItem("loggedInRole");
    if (storedUsername) {
      setUser(storedUsername);
    }
    if (storedRole) {
      setRole(storedRole);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("loggedInUsername");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("loggedInRole");
    setUser(null);
    setRole(null);
  };

  return (
    <Router>
      <nav className="navbar">
        <div>
          <Link to="/" style={{ marginRight: "1rem" }}>首頁</Link>
          {user && (
            <Link to="/favorites" style={{ marginRight: "1rem" }}>我的收藏</Link>
          )}
          {role === "owner" && (
            <Link to="/dashboard" style={{ marginRight: "1rem" }}>管理餐廳</Link>
          )}
        </div>
        <div>
          {user ? (
            <>
              <span style={{ marginRight: "1rem" }}>歡迎，{user}</span>
              <button onClick={handleLogout}>登出</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ marginRight: "1rem" }}>登入</Link>
              <Link to="/register">註冊</Link>
            </>
          )}
        </div>
      </nav>

      <ScrollToTop />
      <Routes>
        <Route path="/" element={<RestaurantSearch />} />
        <Route path="/restaurant/:id" element={<RestaurantDetail />} />
        <Route path="/login" element={<LoginPage setUser={setUser} setRole={setRole} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/favorites" element={<FavoritePage />} />
        <Route path="/dashboard" element={<OwnerDashboard />} />
      </Routes>

      <Footer />
    </Router>
  );
}