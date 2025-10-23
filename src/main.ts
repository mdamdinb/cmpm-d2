import "./style.css";

document.body.innerHTML = `
  <h1>D2 Assignment</h1>
  <canvas id="myCanvas" width="256" height="256"></canvas>
  <button id = "clrButton">clear</button>
  <button id="undoButton">undo</button>
  <button id="redoButton">redo</button>
  
`;

const myCanvas = document.getElementById("myCanvas") as HTMLCanvasElement;
const ctx = myCanvas.getContext("2d")!;
const clrButton = document.getElementById("clrButton") as HTMLButtonElement;
const undoButton = document.getElementById("undoButton") as HTMLButtonElement;
const redoButton = document.getElementById("redoButton") as HTMLButtonElement;

interface Command {
  execute(ctx: CanvasRenderingContext2D): void;
}

interface DrawableCommand extends Command {
  drag(x: number, y: number): void;
}

class MarkerLine implements DrawableCommand {
  private points: { x: number; y: number }[];

  constructor(x: number, y: number) {
    this.points = [{ x, y }];
  }

  drag(x: number, y: number): void {
    this.points.push({ x, y });
  }

  execute(ctx: CanvasRenderingContext2D): void {
    if (this.points.length > 1) {
      ctx.beginPath();
      const { x, y } = this.points[0]!;
      ctx.moveTo(x, y);
      for (const point of this.points) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
    }
  }
}

const commands: Command[] = [];
const redoStack: Command[] = [];
let currentCommand: DrawableCommand | null = null;

clrButton.addEventListener("click", () => {
  commands.splice(0, commands.length);
  dispatchDrawingChanged();
});

undoButton.addEventListener("click", () => {
  if (commands.length > 0) {
    redoStack.push(commands.pop()!);
    dispatchDrawingChanged();
  }
});

redoButton.addEventListener("click", () => {
  if (redoStack.length > 0) {
    commands.push(redoStack.pop()!);
    dispatchDrawingChanged();
  }
});

myCanvas.addEventListener("mousedown", (e) => {
  currentCommand = new MarkerLine(e.offsetX, e.offsetY);
  commands.push(currentCommand);
  redoStack.splice(0, redoStack.length); //clear redo stack on new stroke
  dispatchDrawingChanged();
});

myCanvas.addEventListener("mousemove", (e) => {
  if (currentCommand) {
    currentCommand.drag(e.offsetX, e.offsetY);
    dispatchDrawingChanged();
  }
});

myCanvas.addEventListener("mouseup", () => {
  currentCommand = null;
});

// Custom event dispatch
function dispatchDrawingChanged() {
  const event = new CustomEvent("drawing-changed");
  myCanvas.dispatchEvent(event);
}

// Observer for drawing changes
myCanvas.addEventListener("drawing-changed", () => {
  redrawCanvas();
});

function redrawCanvas() {
  ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;

  for (const command of commands) {
    command.execute(ctx);
  }
}
