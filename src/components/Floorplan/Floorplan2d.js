import React, { useState, useRef } from "react";
import { Stage, Layer, Line, Text } from "react-konva";
import { useNavigate, Link , useParams} from "react-router-dom";
import { Search, User, ArrowRightCircle } from "lucide-react";
import LogoutButton from "../Login-in/LogoutButton";
import Konva from "konva";
import "./Floorplan2d.css"
import Chatbot from "../ChatBot/Chatbot";

const GRID_SIZE = 20;
const WALL_THICKNESS = 3;

const FloorPlan = ({userId}) => {
  const {user_id, room_id} = useParams()
  const [walls, setWalls] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState("draw");
  const [unit, setUnit] = useState("feet");
  const stageRef = useRef();
  const navigate = useNavigate();

  const conversionFactor = unit === "feet" ? 1 : 0.3048;

  const createGrid = (width, height, gridSize) => {
    const gridLines = [];
    for (let i = 0; i <= width / gridSize; i++) {
      gridLines.push(
        <Line
          key={`v-${i}`}
          points={[i * gridSize, 0, i * gridSize, height]}
          stroke="#E6D5C3"
          strokeWidth={0.5}
          dash={[2, 4]}
        />
      );
    }
    for (let i = 0; i <= height / gridSize; i++) {
      gridLines.push(
        <Line
          key={`h-${i}`}
          points={[0, i * gridSize, width, i * gridSize]}
          stroke="#E6D5C3"
          strokeWidth={0.5}
          dash={[2, 4]}
        />
      );
    }
    return gridLines;
  };

  const snapToGrid = (x, y) => ({
    x: Math.round(x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(y / GRID_SIZE) * GRID_SIZE,
  });

  const handleMouseDown = (e) => {
    if (tool !== "draw") return;
    const pos = e.target.getStage().getPointerPosition();
    const snapped = snapToGrid(pos.x, pos.y);
    setWalls([
      ...walls,
      { points: [snapped.x, snapped.y, snapped.x, snapped.y] },
    ]);
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || tool !== "draw") return;
    const pos = e.target.getStage().getPointerPosition();
    const snapped = snapToGrid(pos.x, pos.y);
    const updatedWalls = [...walls];
    const currentWall = updatedWalls[updatedWalls.length - 1];
    currentWall.points[2] = snapped.x;
    currentWall.points[3] = snapped.y;
    setWalls(updatedWalls);
  };

  const handleMouseUp = () => {
    if (isDrawing && tool === "draw") {
      setIsDrawing(false);
    }
  };

  const handleWallClick = (index) => {
    if (tool === "delete") {
      const updatedWalls = walls.filter((_, i) => i !== index);
      setWalls(updatedWalls);
    }
  };

  const handleSave = () => {
    const stage = stageRef.current;

    // Find the grid layer and hide it before exporting
    const gridLayer = stage.findOne(".grid-layer");
    if (gridLayer) gridLayer.visible(false);

    // Create a temporary white rectangle as the background
    const backgroundLayer = new Konva.Rect({
      width: stage.width(),
      height: stage.height(),
      fill: "white",
    });
    stage.getLayers()[0].add(backgroundLayer);
    backgroundLayer.moveToBottom();

    // Create a temporary Konva Text node for "Decora"
    const decoraText = new Konva.Text({
      text: "Decora",
      fontSize: 25,
      fontFamily: "Playfair Display",
      fill: "#6366f1",
      x: stage.width() - 100,
      y: stage.height() - 30,
    });
    stage.getLayers()[0].add(decoraText);

    // Export the stage to an image
    const uri = stage.toDataURL({
      mimeType: "image/png",
      pixelRatio: 2,
    });

    // Cleanup: Remove temporary background and text node, and revert visibility of grid
    backgroundLayer.destroy();
    decoraText.destroy();
    if (gridLayer) gridLayer.visible(true);

    // Trigger the download
    const link = document.createElement("a");
    link.href = uri;
    link.download = "floorplan.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="floorplan-container">
      <nav className="nav">
        <div className="nav-content">
          <div className="nav-left">
          <h1 className="logo">
    <a href="/main-page" className="logo-link">Decora</a>
</h1>
            <div className="nav-links">
              {/* <a href="/">Design</a> */}
              <a href="/products">Products</a>
              <Link to={`/${user_id}/budget-estimator`}>Budget Estimator</Link>
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

      <div className="content">
        <h2 className="header-text">
          Draw the 2D Layout of your room in the grid below
        </h2>

        <div className="canvas-container">
          <div className="toolbar">
            <div className="toolbar-left">
              <button
                onClick={() => setTool("draw")}
                className={`tool2d-button ${tool === "draw" ? "active" : ""}`}
              >
                Draw Wall
              </button>
              <button
                onClick={() => setTool("delete")}
                className={`tool2d-button ${tool === "delete" ? "active" : ""}`}
              >
                Delete Wall
              </button>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="tool2d-select"
              >
                <option value="feet">Feet</option>
                <option value="meters">Meters</option>
              </select>
              <button onClick={() => setWalls([])} className="tool2d-button">
                Clear All
              </button>
              <button onClick={handleSave} className="tool2d-button">
                Download
              </button>
            </div>
            <div className="toolbar-right">
              <button
                onClick={() =>
                  navigate(`/${user_id}/${room_id}/floorplan3d`, { state: { layout: walls } })
                }
                className="submit-button"
              >
                Furnish in 3D
                <ArrowRightCircle className="submit-icon" />
              </button>
            </div>
          </div>

          <Stage
            width={window.innerWidth - 100}
            height={600}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            ref={stageRef}
          >
            <Layer>
              {createGrid(window.innerWidth - 100, 600, GRID_SIZE)}
              {walls.map((wall, index) => (
                <React.Fragment key={index}>
                  <Line
                    points={wall.points}
                    stroke={tool === "delete" ? "#B22222" : "#6366f1"}
                    strokeWidth={WALL_THICKNESS}
                    onClick={() => handleWallClick(index)}
                  />
                  <Text
                    x={(wall.points[0] + wall.points[2]) / 2}
                    y={(wall.points[1] + wall.points[3]) / 2 - 15}
                    text={`${(
                      (Math.sqrt(
                        (wall.points[2] - wall.points[0]) ** 2 +
                          (wall.points[3] - wall.points[1]) ** 2
                      ) /
                        GRID_SIZE) *
                      conversionFactor
                    ).toFixed(1)} ${unit}`}
                    fontSize={12}
                    fill="#6366f1"
                  />
                </React.Fragment>
              ))}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
};

export default FloorPlan;
