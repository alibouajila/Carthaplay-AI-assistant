import React from "react";
import Sidebar from "../components/SideMenu";

function Mygames() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-4">My Games Page</div>
    </div>
  );
}

export default Mygames;
