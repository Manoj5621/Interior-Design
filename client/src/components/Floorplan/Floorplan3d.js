// Floorplan3D.js
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import * as THREE from "three";
import { OrbitControls } from "three-stdlib";
import "./Floorplan3d.css";

// Import necessary components
import FurnitureGrid from "./FurnitureGrid.js";
import ModelGrid from "./ModelGrid.js";
import ModelRenderer from './ModelItem';
import Cart from './Cart.js';

// ICONS
import { Box, ShoppingCart, Download, X, Search, User, RotateCw, RefreshCw } from "lucide-react"; 
import LogoutButton from "../Login-in/LogoutButton.js";

// --- Constants ---
const WALL_HEIGHT = 250;
const WALL_THICKNESS = 10;
const INITIAL_CAMERA_POSITION = new THREE.Vector3(-500, WALL_HEIGHT * 3, 1000);

const FloorPlan3D = () => {
    const { user_id, room_id } = useParams();
    const mountRef = useRef(null);
    const location = useLocation();
    
    // State for Three.js objects
    const [sceneObjects, setSceneObjects] = useState(null);
    const controlsRef = useRef(null);
    
    // State for product and interaction
    const [furnitureItems, setFurnitureItems] = useState([]);
    const [activeTab, setActiveTab] = useState("MODELS");
    const [selectedModel, setSelectedModel] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [cartPrice, SetCartPrice] = useState(0);
    const [floorplanBounds, setFloorplanBounds] = useState({
        minX: -Infinity, maxX: Infinity, minZ: -Infinity, maxZ: Infinity,
    });
    
    // Loading/Error states
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [furnitureLoading, setFurnitureLoading] = useState(false);
    
    // Critical Ref: The THREE.Group to manage all walls (used for cleanup)
    const wallGroupRef = useRef(new THREE.Group()); 
    // Critical Ref: To prevent multiple Three.js instances
    const sceneSetupRef = useRef({ scene: null, renderer: null, animateId: null, initialized: false });

    // Helper function to update cart state
    const handleCartItems = useCallback((items) => {
        setCartItems(items);
    }, []);

    // Function to rotate the orbit controls 90 degrees around the center
    const rotateView = () => {
        if (controlsRef.current) {
            const controls = controlsRef.current;
            
            // Calculate new position based on current position and a 90-degree rotation
            const currentPosition = controls.object.position.clone();
            const target = controls.target.clone();
            const vector = currentPosition.sub(target);
            
            // Rotate the vector 90 degrees around the Y-axis (up axis)
            const angle = Math.PI / 2; // 90 degrees in radians
            const newX = vector.x * Math.cos(angle) - vector.z * Math.sin(angle);
            const newZ = vector.x * Math.sin(angle) + vector.z * Math.cos(angle);
            
            const newPosition = new THREE.Vector3(newX, vector.y, newZ).add(target);
            
            // Apply the new position
            controls.object.position.copy(newPosition);
            
            // Invalidate the control's state to force an update in the next animation frame
            controls.update(); 
        }
    };
    
    // --- Data Fetching ---
    useEffect(() => {
        const fetchProducts = async () => {
            setFurnitureLoading(true);
            setError(null); 
            try {
                // Ensure your backend server is running on port 5002 for this to work
                const response = await fetch('http://localhost:5002/products'); 
                if (!response.ok) {
                    throw new Error(`Failed to fetch products. Status: ${response.status}`);
                }
                const data = await response.json();
                setFurnitureItems(data);
            } catch (error) {
                console.error('Error fetching products:', error);
                setError(`Failed to load furniture data. Details: ${error.message || 'Network error'}`);
            } finally {
                setFurnitureLoading(false);
            }
        };
        fetchProducts();
    }, []); 
    
    const handleDownload = () => {
        // Implement proper screenshot logic here
        alert("Download feature is temporarily disabled. Use browser's screenshot utility.");
    };
    
    const handleModelDrop = useCallback(() => {
        // Reset selected model after successful placement in ModelRenderer
        setSelectedModel(null);
    }, []);

    // --- Three.js Initialization and Wall/Floor Creation (Fixed Version) ---
    useEffect(() => {
        const wallsData = location.state?.layout || [];
        
        if (!mountRef.current || sceneSetupRef.current.initialized) return;

        // Cleanup previous instance before creating a new one (CRITICAL FIX)
        const cleanupPrevious = () => {
            if (sceneSetupRef.current.animateId) {
                cancelAnimationFrame(sceneSetupRef.current.animateId);
            }
            if (sceneSetupRef.current.renderer) {
                mountRef.current?.removeChild(sceneSetupRef.current.renderer.domElement);
                sceneSetupRef.current.renderer.dispose();
            }
            if (sceneSetupRef.current.scene) {
                sceneSetupRef.current.scene.traverse((object) => {
                    if (object instanceof THREE.Mesh) {
                        object.geometry.dispose();
                        if (Array.isArray(object.material)) {
                            object.material.forEach(m => m.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                });
            }
        };
        cleanupPrevious(); 
        
        let renderer, scene, camera, controls, animateId;

        try {
            // Mark as initialized to prevent duplicate initialization
            sceneSetupRef.current.initialized = true;
            
            // 1. Scene Setup
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xffffff); // White background
            
            // Add wall group to scene
            const wallGroup = wallGroupRef.current;
            scene.add(wallGroup);
            
            // 2. Camera Setup
            camera = new THREE.PerspectiveCamera(
                45,
                mountRef.current.clientWidth / mountRef.current.clientHeight,
                1,
                10000
            );
            camera.position.copy(INITIAL_CAMERA_POSITION);
            camera.lookAt(0, 0, 0);

            // 3. Renderer Setup
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            mountRef.current.appendChild(renderer.domElement);
            
            // 4. Geometry and Layout Calculation
            let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
            wallsData.forEach((wall) => {
                const [x1, y1, x2, y2] = wall.points;
                minX = Math.min(minX, x1, x2);
                maxX = Math.max(maxX, x1, x2);
                minZ = Math.min(minZ, y1, y2); 
                maxZ = Math.max(maxZ, y1, y2); 
            });

            const centerX = (minX + maxX) / 2;
            const centerZ = (minZ + maxZ) / 2;
            
            // 5. Wall Creation (CRITICAL: Clear the group here)
            wallGroup.clear(); 
            if (wallsData.length > 0) {
                wallsData.forEach((wall) => {
                    const [x1, z1, x2, z2] = wall.points; 
                    const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2));
                    
                    const centerWallX = (x1 + x2) / 2 - centerX;
                    const centerWallZ = (z1 + z2) / 2 - centerZ;

                    const wallGeometry = new THREE.BoxGeometry(length, WALL_HEIGHT, WALL_THICKNESS);
                    const wallMaterial = new THREE.MeshStandardMaterial({
                        color: 0x1565C0, // Blue wall color
                        roughness: 0.2,
                        metalness: 0.1,
                        side: THREE.FrontSide, 
                    });

                    const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
                    wallMesh.position.set(centerWallX, WALL_HEIGHT / 2, centerWallZ);
                    const angle = Math.atan2(z2 - z1, x2 - x1);
                    wallMesh.rotation.y = -angle;

                    wallMesh.userData.isWall = true; 
                    wallGroup.add(wallMesh);
                });
            } else {
                // Fallback walls logic (same as original for function)
                const defaultWallSize = 1000;
                const fallbackWallGeometry = new THREE.BoxGeometry(defaultWallSize, WALL_HEIGHT, WALL_THICKNESS);
                const fallbackWallMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x1565C0, 
                    side: THREE.FrontSide 
                });
                
                const half = defaultWallSize / 2;
                
                let wall1 = new THREE.Mesh(fallbackWallGeometry, fallbackWallMaterial.clone());
                wall1.position.set(0, WALL_HEIGHT / 2, -half);
                wallGroup.add(wall1);
                
                let wall2 = new THREE.Mesh(fallbackWallGeometry, fallbackWallMaterial.clone());
                wall2.position.set(0, WALL_HEIGHT / 2, half);
                wallGroup.add(wall2);
                
                let wall3 = new THREE.Mesh(fallbackWallGeometry, fallbackWallMaterial.clone());
                wall3.rotation.y = Math.PI / 2;
                wall3.position.set(-half, WALL_HEIGHT / 2, 0);
                wallGroup.add(wall3);

                let wall4 = new THREE.Mesh(fallbackWallGeometry, fallbackWallMaterial.clone());
                wall4.rotation.y = Math.PI / 2;
                wall4.position.set(half, WALL_HEIGHT / 2, 0);
                wallGroup.add(wall4);

                minX = -half; maxX = half; minZ = -half; maxZ = half;
            }

            // 6. Floor Creation
            const floorWidth = maxX - minX;
            const floorDepth = maxZ - minZ;
            const floorGeometry = new THREE.PlaneGeometry(floorWidth, floorDepth);
            const floorMaterial = new THREE.MeshStandardMaterial({
                color: 0xf5f5f5, // Light gray floor color
                roughness: 0.8,
                metalness: 0.1,
            });
            const floor = new THREE.Mesh(floorGeometry, floorMaterial);
            floor.rotation.x = -Math.PI / 2;
            floor.position.set(0, 0, 0);
            floor.userData.isFloor = true;
            scene.add(floor);
            
            setFloorplanBounds({
                minX: -floorWidth / 2, maxX: floorWidth / 2, minZ: -floorDepth / 2, maxZ: floorDepth / 2,
            });

            // 7. Lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(500, 1000, 500);
            directionalLight.target.position.set(0, 0, 0); // Ensure light points to the center
            scene.add(directionalLight);
            scene.add(directionalLight.target);

            // 8. Controls Setup
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.1;
            controls.target.set(0, WALL_HEIGHT / 2, 0);
            controls.minDistance = 200;
            controls.maxDistance = 3000;
            // Enable 360-degree rotation
            controls.minPolarAngle = 0;
            controls.maxPolarAngle = Math.PI;
            controlsRef.current = controls;

            // 9. Animation Loop
            const animate = () => {
                animateId = requestAnimationFrame(animate);
                controls.update();
                renderer.render(scene, camera);
            };
            animate();

            // Store the setup objects for cleanup and ModelRenderer use
            sceneSetupRef.current = { scene, renderer, animateId, initialized: true };
            setSceneObjects({ scene, camera, renderer, floor, wallGroup: wallGroupRef.current });

            // 10. Resize Handler (DEFINED BEFORE USE)
            const handleResize = () => {
                if (mountRef.current) {
                    camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
                    camera.updateProjectionMatrix();
                    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
                }
            };
            window.addEventListener("resize", handleResize);

            // 11. Cleanup (This now calls the dedicated cleanup function)
            return () => {
                cleanupPrevious();
                window.removeEventListener("resize", handleResize);
                sceneSetupRef.current.initialized = false;
            };

        } catch (err) {
            console.error("Three.js setup error:", err);
            setError("A graphics error occurred. Your browser/device may not support WebGL.");
        }
    }, [location.state?.layout]); 

    // --- Render JSX (New Interface) ---
    return (
        <div className="modern-floorplan-container">
            {/* Navigation */}
            <nav className="modern-nav">
                <div className="modern-nav-content">
                    <div className="modern-nav-left">
                        <h1 className="modern-logo">
                            <Link to={`/`} className="modern-logo-link">Decora 3D</Link>
                        </h1>
                        <div className="modern-nav-links">
                            <Link to={`/${user_id}/budget-estimator`}>Budget Estimator</Link>
                            <Link to={`/products`}>Products</Link>
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

            <div className="modern-content" style={{ display: 'flex', gap: '20px', padding: '20px' }}>
                {/* 3D Viewer Container */}
                <div 
                    className="modern-canvas-container" 
                    style={{ flex: 1.5, minHeight: '80vh', position: 'relative' }}
                >
                    <div ref={mountRef} className="threejs-container" />
                    
                    {/* 3D Tool Overlay */}
                    <div className="tool3d-overlay">
                        <button className="tool3d-button download-button" onClick={handleDownload} title="Download Screenshot">
                            <Download size={16} style={{ marginRight: '5px' }} /> Download
                        </button>
                        <button className="tool3d-button rotate-button" onClick={rotateView} title="Rotate View 90°">
                            <RefreshCw size={16} style={{ marginRight: '5px' }} /> Rotate
                        </button>
                    </div>

                    {/* Model Renderer (Handles GLTF/OBJ loading and manipulation) */}
                    {sceneObjects && (
                        <ModelRenderer
                            scene={sceneObjects.scene}
                            camera={sceneObjects.camera}
                            renderer={sceneObjects.renderer}
                            selectedModel={selectedModel}
                            walls={location.state?.layout || []}
                            floorBounds={floorplanBounds}
                            onError={setError}
                            onLoadingChange={setIsLoading}
                            orbitControls={controlsRef.current}
                            onModelDrop={handleModelDrop}
                        />
                    )}
                    
                    {/* Overlays for Loading/Error */}
                    {isLoading && <div className="loading-indicator">Loading Model...</div>}
                    
                    {error && (
                        <div className="error-message">
                            Error: {error}
                            <button 
                                onClick={() => setError(null)} 
                                className="dismiss-error-button"
                                title="Dismiss Error"
                            >
                                <X size={16}/>
                            </button>
                        </div>
                    )}
                </div>
                
                {/* Side Panel for Models and Furniture */}
                <div 
                    className="furniture-section" 
                    style={{ 
                        flex: 1, 
                        minHeight: '80vh', 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid rgba(21, 101, 192, 0.2)', 
                        borderRadius: '16px',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                        color: '#333'
                    }}
                >
                    <div className="furniture-header" style={{ backgroundColor: 'transparent', borderBottom: '1px solid rgba(21, 101, 192, 0.2)' }}>
                        <button
                            className={`header-button ${activeTab === "MODELS" ? "active" : ""}`}
                            onClick={() => setActiveTab("MODELS")}
                            style={{ color: activeTab === "MODELS" ? '#fff' : '#1565C0', background: activeTab === "MODELS" ? '#1565C0' : 'rgba(21, 101, 192, 0.1)', borderColor: 'transparent' }}
                        >
                            <Box size={18} style={{ marginRight: '5px' }} /> MODELS
                        </button>
                        <button
                            className={`header-button ${activeTab === "FURNITURE" ? "active" : ""}`}
                            onClick={() => setActiveTab("FURNITURE")}
                            style={{ color: activeTab === "FURNITURE" ? '#fff' : '#1565C0', background: activeTab === "FURNITURE" ? '#1565C0' : 'rgba(21, 101, 192, 0.1)', borderColor: 'transparent' }}
                        >
                             FURNITURE
                        </button>
                        <button
                            className={`header-button ${activeTab === "CART" ? "active" : ""}`}
                            onClick={() => setActiveTab("CART")}
                            style={{ color: activeTab === "CART" ? '#fff' : '#1565C0', background: activeTab === "CART" ? '#1565C0' : 'rgba(21, 101, 192, 0.1)', borderColor: 'transparent' }}
                        >
                            <ShoppingCart size={18} style={{ marginRight: '5px' }} /> CART
                        </button>
                    </div>

                    <div className="furniture-grid" style={{ overflowY: 'auto' }}>
                        {activeTab === "FURNITURE" && furnitureLoading && (
                            <div className="loading-indicator-small" style={{ color: '#1565C0' }}>Loading furniture list...</div>
                        )}
                        
                        {activeTab === "FURNITURE" && (
                            <FurnitureGrid
                                FurnitureLoading={furnitureLoading}
                                products={furnitureItems}
                                items={cartItems}
                                handleCartItems={handleCartItems}
                                cartPrice={cartPrice}
                                handleCartPrice={SetCartPrice}
                            />
                        )}
                        {activeTab === "MODELS" && (
                            <ModelGrid
                                apiKey="34049ad4ef4e47948ecc4fb52d39c8c4"
                                onModelSelect={setSelectedModel}
                            />
                        )}
                        {activeTab === "CART" && (
                            <Cart
                                items={cartItems}
                                handleCartItems={handleCartItems}
                                cartPrice={cartPrice}
                                handleCartPrice={SetCartPrice}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FloorPlan3D;