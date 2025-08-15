import React from "react";
import "./RoomCard.css";
import { useNavigate } from "react-router-dom";
import { Plus, Home, Utensils, Bed, Armchair } from "lucide-react";

function RoomCard({ title, isAdd = false, onAdd, onDelete, userId }) {
  const navigate = useNavigate();

  const roomId =`${title}=room`

  
  const handleCardClick = () => {
    if (isAdd) {
      onAdd();
    } else {
      navigate(`/${userId}/${roomId}/floorplan2d`); //ADD LINK HERE 
    }
  };

  const getIcon = () => {
    switch (title.toLowerCase()) {
      case "living room":
        return <Home className="room-icon" size={64} />;
      case "kitchen":
        return <Utensils className="room-icon" size={64} />;
      case "bedroom":
        return <Bed className="room-icon" size={64} />;
      default:
        return <Armchair className="room-icon" size={64} />;
    }
  };

  return (
    <div
      className={`room-card ${isAdd ? "room-card-add" : ""}`}
      onClick={handleCardClick} 
    >
      {isAdd ? (
        <>
          <Plus
            className="icon"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
          />
          <span className="add-text">Add New Room</span>
        </>
      ) : (
        <>
          <div className="room-image">{getIcon()}</div>
          <span className="room-title">{title}</span>
          {onDelete && (
            <button
              className="dlt-btn"
              onClick={(e) => {
                e.stopPropagation(); 
                onDelete(title);
              }}
            >
              Delete
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default RoomCard;
