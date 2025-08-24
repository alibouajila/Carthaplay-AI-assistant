import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Mygames from "./pages/Mygames";
function App() {
  return (
    <Router>
 
      <Routes>
        <Route path="/" element={<Home />} />
*        <Route path="/my-games" element={<Mygames />} />
      </Routes>
    </Router>
  );
}

export default App;
