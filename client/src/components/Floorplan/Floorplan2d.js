// Floorplan2d.js
import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Line, Text, Rect } from "react-konva";
import { useNavigate, Link, useParams } from "react-router-dom";
import { Search, User, ArrowRightCircle, Minus, Plus, Download, Trash2, Move, Expand, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import LogoutButton from "../Login-in/LogoutButton";
import Konva from "konva";
import "./Floorplan2d.css";
import Chatbot from "../ChatBot/Chatbot";

const GRID_SIZE = 20;
const WALL_THICKNESS = 3;

const FloorPlan = ({ userId }) => {
  const { user_id, room_id } = useParams();
  const [walls, setWalls] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState("draw");
  const [unit, setUnit] = useState("feet");
  const [toolSize, setToolSize] = useState(3);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [isExtending, setIsExtending] = useState(false);
  const [extendDirection, setExtendDirection] = useState(null);
  const stageRef = useRef();
  const containerRef = useRef();
  const navigate = useNavigate();

  const conversionFactor = unit === "feet" ? 1 : 0.3048;

  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: Math.max(800, window.innerWidth - 100),
        height: Math.max(600, window.innerHeight - 200)
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const createGrid = (width, height, gridSize) => {
    const gridLines = [];
    for (let i = 0; i <= width / gridSize; i++) {
      gridLines.push(
        <Line
          key={`v-${i}`}
          points={[i * gridSize, 0, i * gridSize, height]}
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth={0.5}
        />
      );
    }
    for (let i = 0; i <= height / gridSize; i++) {
      gridLines.push(
        <Line
          key={`h-${i}`}
          points={[0, i * gridSize, width, i * gridSize]}
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth={0.5}
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
    if (isExtending) return;
    
    if (tool !== "draw") return;
    const pos = e.target.getStage().getPointerPosition();
    const snapped = snapToGrid(pos.x - stagePosition.x, pos.y - stagePosition.y);
    setWalls([
      ...walls,
      { points: [snapped.x, snapped.y, snapped.x, snapped.y], thickness: toolSize },
    ]);
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (isExtending) {
      handleExtendCanvas(e);
      return;
    }
    
    if (!isDrawing || tool !== "draw") return;
    
    // Get the stage from the ref instead of the event target
    const stage = stageRef.current;
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    const snapped = snapToGrid(pos.x - stagePosition.x, pos.y - stagePosition.y);
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
    
    if (isExtending) {
      setIsExtending(false);
      setExtendDirection(null);
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
      width: stageSize.width,
      height: stageSize.height,
      fill: "white",
    });
    stage.getLayers()[0].add(backgroundLayer);
    backgroundLayer.moveToBottom();

    // Create a temporary Konva Text node for "Decora"
    const decoraText = new Konva.Text({
      text: "Decora",
      fontSize: 25,
      fontFamily: "Playfair Display",
      fill: "#1565C0",
      x: stageSize.width - 100,
      y: stageSize.height - 30,
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

  const startExtending = (direction) => {
    setIsExtending(true);
    setExtendDirection(direction);
  };

  const handleExtendCanvas = (e) => {
    if (!isExtending) return;
    
    // Get the stage from the ref instead of the event target
    const stage = stageRef.current;
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    const extendAmount = 20;
    
    switch (extendDirection) {
      case 'right':
        setStageSize(prev => ({ ...prev, width: prev.width + extendAmount }));
        break;
      case 'left':
        if (stageSize.width > 400) {
          setStageSize(prev => ({ ...prev, width: prev.width - extendAmount }));
          setStagePosition(prev => ({ ...prev, x: prev.x + extendAmount }));
        }
        break;
      case 'bottom':
        setStageSize(prev => ({ ...prev, height: prev.height + extendAmount }));
        break;
      case 'top':
        if (stageSize.height > 300) {
          setStageSize(prev => ({ ...prev, height: prev.height - extendAmount }));
          setStagePosition(prev => ({ ...prev, y: prev.y + extendAmount }));
        }
        break;
      default:
        break;
    }
  };

  // Function to handle button click for extending canvas
  const handleExtendButtonClick = (direction) => {
    const extendAmount = 50; // Fixed amount to extend when button is clicked
    
    switch (direction) {
      case 'up':
        if (stageSize.height > 300) {
          setStageSize(prev => ({ ...prev, height: prev.height - extendAmount }));
          setStagePosition(prev => ({ ...prev, y: prev.y + extendAmount }));
        }
        break;
      case 'down':
        setStageSize(prev => ({ ...prev, height: prev.height + extendAmount }));
        break;
      case 'left':
        if (stageSize.width > 400) {
          setStageSize(prev => ({ ...prev, width: prev.width - extendAmount }));
          setStagePosition(prev => ({ ...prev, x: prev.x + extendAmount }));
        }
        break;
      case 'right':
        setStageSize(prev => ({ ...prev, width: prev.width + extendAmount }));
        break;
      default:
        break;
    }
  };

  return (
    <div className="modern-floorplan-container">
      <nav className="modern-nav">
        <div className="modern-nav-content">
          <div className="modern-nav-left">
            <h1 className="modern-logo">
              <a href="/main-page" className="modern-logo-link">Decora</a>
            </h1>
            <div className="modern-nav-links">
              <a href="/products">Products</a>
              <Link to={`/${user_id}/budget-estimator`}>Budget Estimator</Link>
            </div>
          </div>
          <div className="modern-nav-right">
            <div className="modern-search-container">
              <input
                type="text"
                placeholder="Search"
                className="modern-search-input"
              />
              <Search className="modern-search-icon" />
            </div>
            <button className="modern-profile-button">
              <User className="modern-profile-icon" />
            </button>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <div className="modern-content">
        <h2 className="modern-header-text">
          Design Your Dream Space in 2D
        </h2>
        <p className="modern-subheader">
          Draw your room layout and we'll transform it into a 3D masterpiece
        </p>

        <div className="modern-canvas-container">
          <div className="modern-toolbar">
            <div className="modern-toolbar-left">
              <div className="tool-section">
                <h3>Drawing Tools</h3>
                <div className="tool-group">
                  <button
                    onClick={() => setTool("draw")}
                    className={`modern-tool-button ${tool === "draw" ? "active" : ""}`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 19l7-7 3 3-7 7-3-3z" />
                      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                      <path d="M2 2l7.586 7.586" />
                      <circle cx="11" cy="11" r="2" />
                    </svg>
                    Pencil
                  </button>
                  <button
                    onClick={() => setTool("delete")}
                    className={`modern-tool-button ${tool === "delete" ? "active" : ""}`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                      <line x1="18" y1="9" x2="12" y2="15" />
                      <line x1="12" y1="9" x2="18" y2="15" />
                    </svg>
                    Eraser
                  </button>
                </div>
              </div>

              <div className="tool-section">
                <h3>Tool Size</h3>
                <div className="size-control">
                  <button 
                    onClick={() => setToolSize(Math.max(1, toolSize - 1))}
                    className="size-button"
                  >
                    <Minus size={14} />
                  </button>
                  <div className="size-display">
                    <div 
                      className="size-preview"
                      style={{ width: `${toolSize * 4}px`, height: `${toolSize * 4}px` }}
                    ></div>
                    <span>{toolSize}px</span>
                  </div>
                  <button 
                    onClick={() => setToolSize(Math.min(10, toolSize + 1))}
                    className="size-button"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="tool-section">
                <h3>Units</h3>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="modern-unit-select"
                >
                  <option value="feet">Feet</option>
                  <option value="meters">Meters</option>
                </select>
              </div>

              <div className="tool-section">
                <h3>Extend Canvas</h3>
                <div className="extend-direction-buttons">
                  <h4>Extend by Click</h4>
                  <div className="direction-buttons-grid">
                    <button 
                      className="direction-button up"
                      onClick={() => handleExtendButtonClick('up')}
                      title="Extend Up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <div className="direction-buttons-middle">
                      <button 
                        className="direction-button left"
                        onClick={() => handleExtendButtonClick('left')}
                        title="Extend Left"
                      >
                        <ArrowLeft size={14} />
                      </button>
                      <div className="direction-center">
                        <Move size={16} />
                      </div>
                      <button 
                        className="direction-button right"
                        onClick={() => handleExtendButtonClick('right')}
                        title="Extend Right"
                      >
                        <ArrowRight size={14} />
                      </button>
                    </div>
                    <button 
                      className="direction-button down"
                      onClick={() => handleExtendButtonClick('down')}
                      title="Extend Down"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="modern-toolbar-right">
              <div className="action-buttons">
                <button onClick={() => setWalls([])} className="modern-action-button clear">
                  <Trash2 size={16} />
                  Clear All
                </button>
                <button onClick={handleSave} className="modern-action-button download">
                  <Download size={16} />
                  Download
                </button>
                <button
                  onClick={() =>
                    navigate(`/${user_id}/${room_id}/floorplan3d`, { state: { layout: walls } })
                  }
                  className="modern-submit-button"
                >
                  Furnish in 3D
                  <ArrowRightCircle className="modern-submit-icon" />
                </button>
              </div>
            </div>
          </div>

          <div 
            className="modern-stage-container"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            ref={containerRef}
          >
            <div className="canvas-dimensions">
              {Math.round(stageSize.width / GRID_SIZE * conversionFactor)} {unit} × {Math.round(stageSize.height / GRID_SIZE * conversionFactor)} {unit}
            </div>
            <Stage
              width={stageSize.width}
              height={stageSize.height}
              onMouseDown={handleMouseDown}
              ref={stageRef}
              x={stagePosition.x}
              y={stagePosition.y}
            >
              <Layer>
                <Rect
                  width={stageSize.width}
                  height={stageSize.height}
                  fill="rgba(13, 43, 80, 0.5)"
                />
                {createGrid(stageSize.width, stageSize.height, GRID_SIZE)}
                {walls.map((wall, index) => (
                  <React.Fragment key={index}>
                    <Line
                      points={wall.points}
                      stroke={tool === "delete" ? "#ff4d4f" : "#42A5F5"}
                      strokeWidth={wall.thickness || toolSize}
                      onClick={() => handleWallClick(index)}
                      lineCap="round"
                      lineJoin="round"
                      shadowColor={tool === "delete" ? "rgba(255, 77, 79, 0.5)" : "rgba(66, 165, 245, 0.5)"}
                      shadowBlur={5}
                      shadowOffset={{ x: 0, y: 2 }}
                      shadowOpacity={0.3}
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
                      fill="#fff"
                      fontFamily="Inter, sans-serif"
                      padding={5}
                      cornerRadius={3}
                     
                    />
                  </React.Fragment>
                ))}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorPlan;