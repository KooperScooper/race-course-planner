import { useState, useRef, useEffect } from "react";

export default function RaceCoursePlanner() {
  const [hillSpecs, setHillSpecs] = useState({ length: 50, drop: 100, slope: 10 });
  const [gates, setGates] = useState([]);
  const [start, setStart] = useState(null);
  const [finish, setFinish] = useState(null);
  const [tool, setTool] = useState("set");
const [zoomMode, setZoomMode] = useState(null); // Stores "in" or "out" when zoom is active
const [zoom, setZoom] = useState(1);
const [offsetX, setOffsetX] = useState(0);
const [offsetY, setOffsetY] = useState(0);
  const [hoveredGate, setHoveredGate] = useState(null);
  const canvasRef = useRef(null);
  const scale = 20;

  useEffect(() => {
    drawCourse();
  }, [gates, start, finish, hoveredGate, zoom]);

  function addGate(x, y) {
    if (!gates.some(g => g.x === x && g.y === y)) {
      setGates([...gates, { x, y }]);
    }
  }

  function removeGate(x, y) {
    setGates(gates.filter(g => g.x !== x || g.y !== y));
  }

  function setStartPosition(x, y) {
    setStart({ x, y });
  }

  function setFinishPosition(x, y) {
    setFinish({ x, y });
  }

  function getPreviousGate(x, y) {
  let allMarkers = [...gates]; // Start with regular gates
  if (start) allMarkers.push(start); // Include start position if set
  if (finish) allMarkers.push(finish); // Include finish position if set

  return allMarkers.filter(g => g.y < y).sort((a, b) => b.y - a.y)[0];
}

  function zoomIn(event) {
    adjustZoom(event, 1.2);
}

  function zoomOut(event) {
    adjustZoom(event, 1 / 1.2);
}

function adjustZoom(event, zoomFactor) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect(); 

    // Get correct mouse position relative to canvas
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    setZoom((prevZoom) => {
        const newZoom = Math.max(0.5, Math.min(prevZoom * zoomFactor, 5));

        //  Fix: Correct offset calculation to avoid extreme negatives
        const scaleChange = newZoom / prevZoom;
        setOffsetX((prevOffsetX) => (mouseX - prevOffsetX) * (1 - scaleChange) + prevOffsetX);
        setOffsetY((prevOffsetY) => (mouseY - prevOffsetY) * (1 - scaleChange) + prevOffsetY);

        return newZoom;

    });

}



  function drawCourse() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply Zoom & Panning
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(zoom, zoom);
    
  const dynamicScale = scale * zoom; // Scale grid dynamically

// Draw Grid
ctx.strokeStyle = "#ddd";
for (let i = 0; i < hillSpecs.length; i++) {
    for (let j = 0; j < hillSpecs.drop; j++) {
        ctx.strokeRect(i * dynamicScale, j * dynamicScale, dynamicScale, dynamicScale);
    }
}


    // Fixed size for gates and markers
    const gateRadius = 6 / zoom; // Adjust gate size so it stays proportional

    // Draw Gates
    gates.forEach((gate, index) => {
      ctx.fillStyle = index % 2 === 0 ? "red" : "blue";
      ctx.beginPath();
      ctx.arc(gate.x * dynamicScale + dynamicScale / 2, gate.y * dynamicScale + dynamicScale / 2, 6 / zoom, 0, Math.PI * 2);
      ctx.fill();
    });
    
ctx.restore(); //  Reset transformations after drawing

    // Draw Start (Two Circles, 1 Empty Space Apart)
    if (start) {
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.arc((start.x - 1) * scale + scale / 2, start.y * scale + scale / 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc((start.x + 1) * scale + scale / 2, start.y * scale + scale / 2, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw Finish (Two Circles, 15 Empty Spaces Apart)
    if (finish) {
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.arc((finish.x - 7.5) * scale + scale / 2, finish.y * scale + scale / 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc((finish.x + 7.5) * scale + scale / 2, finish.y * scale + scale / 2, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    
    
    ctx.restore(); // Reset transformations

    

    // Draw Line to Hovered Gate
    if (hoveredGate) {
    const previousGate = getPreviousGate(hoveredGate.x, hoveredGate.y);
    if (previousGate) {
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.beginPath();

        // If hovering over the Finish gate, draw from its center
        if (hoveredGate.type === "finish") {
            ctx.moveTo(previousGate.x * scale + scale / 2, previousGate.y * scale + scale / 2);
            ctx.lineTo(finish.x * scale + scale / 2, finish.y * scale + scale / 2);
        } else {
            ctx.moveTo(previousGate.x * scale + scale / 2, previousGate.y * scale + scale / 2);
            ctx.lineTo(hoveredGate.x * scale + scale / 2, hoveredGate.y * scale + scale / 2);
        }

        ctx.stroke();

        
        // Display Distance Text
        const distance = Math.sqrt(
          Math.pow(hoveredGate.x - previousGate.x, 2) +
          Math.pow(hoveredGate.y - previousGate.y, 2)
        ).toFixed(1);
        ctx.fillStyle = "black";
        ctx.font = "14px Arial";
        ctx.fillText(
          `${distance}m`,
          ((previousGate.x + hoveredGate.x) / 2) * scale,
          ((previousGate.y + hoveredGate.y) / 2) * scale - 5
        );
      }
    }
  }

  function getMouseGridPosition(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Convert mouse position to grid coordinates with zoom and offsets
const x = Math.floor(((event.clientX - rect.left) / (scale * zoom)) - offsetX);
const y = Math.floor(((event.clientY - rect.top) - offsetY) / (scale * zoom)); 

console.log(`Mouse Click: (${event.clientX}, ${event.clientY}) → Grid Position: (${x}, ${y})`);

    return { x, y };
}


  function handleCanvasClick(event) {

    const { x, y } = getMouseGridPosition(event);

console.log("Mouse Click Detected!");
    console.log("Raw Mouse X:", event.clientX, "Raw Mouse Y:", event.clientY);
    console.log("Offset X:", offsetX, "Offset Y:", offsetY);
    console.log("Zoom Level:", zoom);
    console.log("Calculated Grid X:", x, "Calculated Grid Y:", y);

    if (zoomMode) {
        adjustZoom(event, zoomMode === "in" ? 1.2 : 1 / 1.2);
        return;
    }

    if (event.type === "click") {
      if (tool === "set") addGate(x, y);
      if (tool === "start") setStartPosition(x, y);
      if (tool === "finish") setFinishPosition(x, y);
    } else if (event.type === "contextmenu") {
      event.preventDefault();
      removeGate(x, y);
    }
  }

  function handleMouseMove(event) {
   
    const { x, y } = getMouseGridPosition(event);
    
    const isGate = gates.some(g => g.x === x && g.y === y);
    
    let isFinish = false;
    if (finish) {
        const leftFinishX = finish.x - 7.5; 
        const rightFinishX = finish.x + 7.5;
        if ((x === Math.floor(leftFinishX) && y === finish.y) || (x === Math.floor(rightFinishX) && y === finish.y)) {
            isFinish = true;
        }
    }

    if (isGate) {
        setHoveredGate({ x, y, type: "gate" });
    } else if (isFinish && finish) {
        setHoveredGate({ x: finish.x, y: finish.y, type: "finish" });
    } else {
        setHoveredGate(null);
    }
}

  return (
    <div className="p-4 h-screen flex flex-row relative">
      <div className="w-1/6 p-2 border-r flex flex-col gap-2">
        <h2 className="text-lg font-bold">Tools</h2>
        <button className={`p-2 border ${tool === "set" ? "bg-gray-300" : ""}`} onClick={() => setTool("set")}>Set Tool</button>
        <button className={`p-2 border ${tool === "start" ? "bg-gray-300" : ""}`} onClick={() => setTool("start")}>Start Tool</button>
        <button className={`p-2 border ${tool === "finish" ? "bg-gray-300" : ""}`} onClick={() => setTool("finish")}>Finish Tool</button>
        <button className={`p-2 border ${zoomMode === "in" ? "bg-gray-300" : ""}`} onClick={() => setZoomMode("in")}>Zoom In</button>
        <button className={`p-2 border ${zoomMode === "out" ? "bg-gray-300" : ""}`} onClick={() => setZoomMode("out")}>Zoom Out</button>
	<button className={`p-2 border ${!zoomMode ? "bg-gray-300" : ""}`} onClick={() => setZoomMode(null)}>Select Tool</button>



    </div>
      <div className="w-5/6 flex flex-col">
        <h1 className="text-xl font-bold">Race Course Planner</h1>
        <canvas
          ref={canvasRef}
          width={hillSpecs.length * scale}
          height={hillSpecs.drop * scale}
          className="border"
          onClick={handleCanvasClick}
          onContextMenu={handleCanvasClick}
          onMouseMove={handleMouseMove}
        />
      </div>
    </div>
  );
}


