import Board from "./components/Board";
import { useBoardStore } from "./store/boardStore";

const App = () => {
  const showGrid = useBoardStore((state) => state.showGrid);
  const toggleGrid = useBoardStore((state) => state.toggleGrid);

  return (
    <div className="app">
      <header className="top-bar">
        <div className="top-bar__title">Tabletop Battle Planner</div>
        <button className="top-bar__button" type="button" onClick={toggleGrid}>
          {showGrid ? "Grid: On" : "Grid: Off"}
        </button>
      </header>
      <main className="board-shell">
        <Board />
      </main>
    </div>
  );
};

export default App;
