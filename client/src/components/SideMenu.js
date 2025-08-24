// src/components/SideMenu.jsx
import { useState } from "react";
import { Home, Gamepad2, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function SideMenu() {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="toggle-btn"
      >
        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {!isCollapsed && <h2 className="sidebar-title">Navigation</h2>}
      <nav className="nav-section">
        <Link to="/" className="nav-item">
          <Home size={20} />
          {!isCollapsed && <span className="nav-text">Home</span>}
        </Link>
        <Link to="/my-games" className="nav-item">
          <Gamepad2 size={20} />
          {!isCollapsed && <span className="nav-text">My Games</span>}
        </Link>
      </nav>
    </aside>
  );
}
