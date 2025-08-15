import React, { useState, useRef } from "react";
import { Stage, Layer, Line, Text } from "react-konva";
import { useNavigate, Link } from "react-router-dom";
import { Search, User, ArrowRightCircle } from "lucide-react";
import LogoutButton from "../Login-in/LogoutButton";
import Konva from "konva";

function NavLink({ children, to }) {
  return (
    <Link to={to} className="nav-link">
      {children}
    </Link>
  );
}

const Navbar = () => {
  return (
    <nav className="nav">
      <div className="nav-content">
        <div className="nav-left">
          <h1 className="logo">Decora</h1>
          <div className="nav-links">
            {/* <a href="/">Design</a> */}
            {/* <a href="/products">Products</a> */}
            <a href="/budget-estimator">Budget Estimator</a>
          </div>
        </div>
        <div className="nav-right">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search"
              className="search-input"
            />
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
};

export default Navbar;
