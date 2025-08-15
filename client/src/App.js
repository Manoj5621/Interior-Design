import React from 'react';
import LandingPage from './components/Landing-Page/landing';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './components/MainPage/MainPage.js';
import Floorplan2d from './components/Floorplan/Floorplan2d.js';
import FloorPlan3d from './components/Floorplan/Floorplan3d.js';
import RoomQuiz from './components/RoomQuiz/RoomQuiz.js';
import CryptoJS from "crypto-js";
import Chatbot from './components/ChatBot/Chatbot.js';
import FurnitureGrid from './components/Floorplan/FurnitureGrid.js';
import { useEffect, useState } from 'react';

function App() {
  const domain = process.env.REACT_APP_AUTH0_DOMAIN;
  const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID;

  const { user, isLoading } = useAuth0();

  const generateUniqueId = (email, length = 20) => {
    // Generate a SHA-256 hash of the email
    const hash = CryptoJS.SHA256(email).toString();
    // Return the first `length` characters of the hash
    return hash.substring(0, length);
  };

  // Generate user_id only if user is authenticated
  const userId = user ? generateUniqueId(user.email, 18) : "12345";

  const [furnitureItems, setFurnitureItems] = useState([]);

  useEffect(() => {
      fetch('http://localhost:5000/products')
        .then(response => response.json())
        .then(data => {
          setFurnitureItems(data);
        })
        .catch(error => {
          console.error('Error fetching products:', error);
        });
    }, []);

  return (
    <Router>
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{
          redirect_uri: `http://localhost:3000/main-page`,
        }}
      >
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/main-page" element={<MainPage />} />
            <Route path="/:user_id/main-page" element={<MainPage />} />
            <Route path="/:user_id/:room_id/floorplan2d" element={<Floorplan2d/>} />
            <Route path="/:user_id/:room_id/floorplan3d" element={<FloorPlan3d />} />
            <Route path="/:user_id/budget-estimator" element={<RoomQuiz />} />
            <Route path ='/products' element={<FurnitureGrid products={furnitureItems}/>}/>
          </Routes>
          <Chatbot/>
        </div>
      </Auth0Provider>
    </Router>
  );
}

export default App;