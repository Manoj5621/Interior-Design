import React, { useState, useEffect } from "react";
import { Search, User, Plus } from "lucide-react";
import "./MainPage.css";
import { useNavigate, Link } from "react-router-dom";
import RoomCard from "./RoomCard";
import { useAuth0 } from "@auth0/auth0-react";
import LogoutButton from "../Login-in/LogoutButton";
import CryptoJS from "crypto-js";

// NavLink Component
function NavLink({ children, to }) {
  return (
    <Link to={to} className="nav-link">
      {children}
    </Link>
  );
}

// Navigation Component
function Navigation(props) {
  return (
    <nav className="nav">
      <div className="nav-content">
        <div className="nav-left">
          <h1 className="logo">Decora</h1>
          <div className="nav-links">
            {/* <NavLink to="/products">Products</NavLink> */}
            <Link to={`/${props.userId}/budget-estimator`}>Budget Estimator</Link>
          </div>
        </div>
        <div className="nav-right">
          <div className="search-container">
            <input type="text" placeholder="Search" className="search-input" />
            <Search className="search-icon" />
          </div>
          <button className="profile-button">
            <User className="profile-icon" />
          </button>
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}

// AddRoomModal Component
function AddRoomModal({ isOpen, onClose, onAdd }) {
  const [roomName, setRoomName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomName.trim()) {
      onAdd(roomName);
      setRoomName("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add New Room</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter room name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            required
          />
          <div className="modal-actions">
            <button type="submit" className="modal-button">
              Add
            </button>
            <button type="button" className="modal-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// Main Page Component
function MainPage() {
  const { user } = useAuth0();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState(["Living Room", "Bedroom", "Kitchen"]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userId, setUserId] = useState(null); // Store userId in state

  const generateUniqueId = (email, length = 20) => {
    const hash = CryptoJS.SHA256(email).toString();
    return hash.substring(0, length);
  };

  useEffect(() => {
    if (user) {
      const generatedUserId = generateUniqueId(user.email, 18);
      setUserId(generatedUserId); // Update userId in state
      navigate(`/${generatedUserId}/main-page`); // Navigate to the dynamic URL
    }
  }, [user, navigate]);

  const handleAddRoom = (roomName) => {
    if (roomName) {
      setRooms((prevRooms) => [...prevRooms, roomName]);
    }
  };

  const handleDeleteRoom = (roomName) => {
    setRooms(rooms.filter((room) => room !== roomName));
  };

  return (
    <div className="container">
      <Navigation userId={userId} /> {/* Pass userId from state */}

      <main className="main">
        <div className="welcome-section">
          <h2 className="welcome-title">Hello {user?.name || "Guest"}</h2>
          <p className="welcome-text">Let's start building your dream space</p>
        </div>

        <div className="home-section">
          <h3 className="section-title" style={{ color: "#8B4513" }}>
            My Projects
          </h3>
          <div className="rooms-container">
            <RoomCard isAdd={true} onAdd={() => setIsModalOpen(true)} userId={userId} />
            {rooms.map((room) => (
              <RoomCard
                key={room}
                title={room}
                onDelete={handleDeleteRoom}
                userId={userId} // Pass userId from state
              />
            ))}
          </div>
        </div>
      </main>

      <AddRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddRoom}
      />
    </div>
  );
}

export default MainPage;