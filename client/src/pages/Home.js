import { motion } from "framer-motion";
import Button from "../components/Button";
import SideMenu from "../components/SideMenu";  
import { FileText, MessageSquare, CheckCircle } from "lucide-react";
import "./Home.css";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-700 to-purple-700 text-white">
      {/* Sidebar */}
      <SideMenu />

      {/* Main Content */}
      <main className="main-content">
        <motion.h1
          className="text-4xl font-extrabold mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Welcome to Carthaplay Game Creator 🎮
        </motion.h1>
        <motion.p
          className="text-lg max-w-2xl mb-8 text-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Create interactive educational games effortlessly. Start by chatting
          with our AI assistant, uploading a PDF, or managing your drafts and
          accepted games.
        </motion.p>

        {/* Action Buttons */}
        <div className="action-buttons">
          <Button className="btn primary">
            <MessageSquare size={20} /> Start with Chat
          </Button>
          <Button className="btn secondary">
            <FileText size={20} /> Upload PDF
          </Button>
          <Button className="btn accent">
            <CheckCircle size={20} /> My Games
          </Button>
        </div>
      </main>
    </div>
  );
}
