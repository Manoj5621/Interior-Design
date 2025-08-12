import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DragControls } from 'three-stdlib';

const ModelRenderer = ({
  scene,
  camera,
  renderer,
  selectedModel,
  walls,
  floorBounds,
  onError,
  onLoadingChange,
  orbitControls,
}) => {
  const modelsRef = useRef([]); // Store all placed models
  const dragControlsRef = useRef(null);
  const [isDraggingEnabled, setIsDraggingEnabled] = useState(true);
  const [isRotatingEnabled, setIsRotatingEnabled] = useState(false);
  const initialMousePosition = useRef({ x: 0, y: 0 });
  const isModelClicked = useRef(null);
  const isDraggingRef = useRef(false);
  const isRotatingRef = useRef(false);

  // Load the 3D model
  const loadModel = (url) => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;

        // Create a group to hold all pieces of the furniture
        const modelGroup = new THREE.Group();
        modelGroup.add(model); // Add the entire model to the group

        // Scale and position the model
        const box = new THREE.Box3().setFromObject(modelGroup);
        const size = box.getSize(new THREE.Vector3());
        const scale = 100 / size.y;
        modelGroup.scale.set(scale, scale, scale);
        modelGroup.position.set(0, 0, 0);

        scene.add(modelGroup);
        modelsRef.current.push(modelGroup);

        // Set up drag controls
        if (dragControlsRef.current) {
          dragControlsRef.current.dispose();
        }

        const dragControls = new DragControls(modelsRef.current, camera, renderer.domElement);
        dragControls.enabled = false; // Disable drag controls by default
        dragControlsRef.current = dragControls;

        // Mouse down event handler
        const onMouseDown = (event) => {
          event.preventDefault();

          const rect = renderer.domElement.getBoundingClientRect();
          const mouse = new THREE.Vector2();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(mouse, camera);

          const intersects = raycaster.intersectObjects(modelsRef.current, true);
          if (intersects.length > 0) {
            isModelClicked.current = intersects[0].object;
            initialMousePosition.current = { x: event.clientX, y: event.clientY };

            // Disable OrbitControls when interacting with the model
            if (orbitControls) {
              orbitControls.enabled = false;
            }

            // Check which button is pressed
            if (event.button === 0) {
              // Left click - enable dragging
              setIsDraggingEnabled(true);
              setIsRotatingEnabled(false);
              if (dragControlsRef.current) {
                dragControlsRef.current.enabled = true;
              }
            } else if (event.button === 2) {
              // Right click - enable rotation
              setIsDraggingEnabled(false);
              setIsRotatingEnabled(true);
              isRotatingRef.current = true;
            }
          }
        };

        // Mouse move event handler
        const onMouseMove = (event) => {
          if (!isModelClicked.current) return;

          event.preventDefault();

          if (isRotatingRef.current && isModelClicked.current) {
            const deltaX = event.clientX - initialMousePosition.current.x;

            // Rotate only around the Z-axis
            isModelClicked.current.rotation.z += deltaX * 0.01;

            // Update initial mouse position
            initialMousePosition.current = { x: event.clientX, y: event.clientY };
          }
        };

        // Mouse up event handler
        const onMouseUp = (event) => {
          event.preventDefault();

          isModelClicked.current = null;
          setIsRotatingEnabled(false);
          isRotatingRef.current = false;

          // Disable drag controls
          if (dragControlsRef.current) {
            dragControlsRef.current.enabled = false;
          }

          // Re-enable OrbitControls
          if (orbitControls) {
            orbitControls.enabled = true;
          }
        };

        // Add event listeners
        renderer.domElement.addEventListener('mousedown', onMouseDown);
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('mouseup', onMouseUp);
        renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

        // Cleanup function
        return () => {
          renderer.domElement.removeEventListener('mousedown', onMouseDown);
          renderer.domElement.removeEventListener('mousemove', onMouseMove);
          renderer.domElement.removeEventListener('mouseup', onMouseUp);
          renderer.domElement.removeEventListener('contextmenu', (e) => e.preventDefault());
        };
      },
      undefined,
      (error) => {
        onError('Error loading model');
        console.error('Error loading model:', error);
      }
    );
  };

  // Load the model when selectedModel changes
  useEffect(() => {
    if (selectedModel && scene && camera && renderer) {
      const fetchModelDetails = async () => {
        try {
          onLoadingChange(true);
          const apiKey = '9d2379512bd84812beb65f0ffe608310';
          const downloadResponse = await fetch(
            `https://api.sketchfab.com/v3/models/${selectedModel}/download`,
            {
              headers: {
                Authorization: "Token 34049ad4ef4e47948ecc4fb52d39c8c4",
              },
            }
          );
          const downloadData = await downloadResponse.json();
          const glbUrl = downloadData.glb.url;

          if (glbUrl) {
            loadModel(glbUrl);
          } else {
            onError('GLB URL not found');
          }
        } catch (error) {
          onError('Error fetching model');
          console.error('Error fetching model:', error);
        } finally {
          onLoadingChange(false);
        }
      };

      fetchModelDetails();
    }
  }, [selectedModel, scene, camera, renderer]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (dragControlsRef.current) {
        dragControlsRef.current.dispose();
      }
      modelsRef.current.forEach(model => {
        scene.remove(model);
        model.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            object.material.dispose();
          }
        });
      });
      modelsRef.current = [];
      // Re-enable OrbitControls on cleanup
      if (orbitControls) {
        orbitControls.enabled = true;
      }
    };
  }, [scene, orbitControls]);

  return null;
};

export default ModelRenderer;