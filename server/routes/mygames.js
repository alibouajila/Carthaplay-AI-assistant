require('dotenv').config();
const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const authenticate = require("../middleware/authenticate"); // JWT middleware
const axios = require("axios");
const multer = require('multer');
const pdf = require('pdf-parse');
const fs = require('fs');
const upload = multer({ dest: 'uploads/' });

// 1️⃣ GET - generate MCQs (preview only)
router.get("/generate", authenticate, async (req, res) => {
  try {

  const { text } = req.query;
  const userId = req.user.id;

    if (!text) {
      return res.status(400).json({ error: "Missing 'text' query parameter" });
    }

    // Check if teacher
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("role, id")
      .eq("id", userId)
      .single();

    if (userError || !userRecord || userRecord.role !== "teacher") {
      return res.status(403).json({ error: "Only teachers can generate MCQs." });
    }
    // Call AI API (existing)
    const aiResponse = await axios.post(process.env.AI_SERVICE_URL, {
      text,
    });

    const mcqs = aiResponse.data.mcqs;

    res.json({
      preview: mcqs,
      note: "This is a preview. You must confirm with POST /games/confirm.",
    });
  } catch (err) {
    console.error("Generate MCQs error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
// 2️⃣ POST - confirm and save MCQs into DB
router.post("/confirm", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject, lesson, difficulty, mcqs } = req.body;

    if (!mcqs || !Array.isArray(mcqs) || mcqs.length === 0) {
      return res.status(400).json({ error: "No MCQs provided." });
    }

    // Check if teacher
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("role, id")
      .eq("id", userId)
      .single();

    if (userError || !userRecord || userRecord.role !== "teacher") {
      return res.status(403).json({ error: "Only teachers can confirm games." });
    }

    // Find teacher record
    const { data: teacher, error: teacherError } = await supabase
      .from("teachers")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (teacherError || !teacher) {
      return res.status(404).json({ error: "Teacher record not found" });
    }

    // Insert game
    const { data: game, error: gameError } = await supabase
      .from("games")
      .insert([
        {
          subject,
          lesson,
          difficulty,
          teacher_id: teacher.id,
          game_code: Math.random().toString(36).substr(2, 8),
        },
      ])
      .select()
      .single();

    if (gameError) return res.status(400).json({ error: gameError.message });

    // Insert questions + answers
    for (const [i, q] of mcqs.entries()) {
      // Step 1: Insert the question first (without correct_answer)
      const { data: question, error: qError } = await supabase
        .from("questions")
        .insert([
          {
            question: q.question,
            game_id: game.id,
            order: q.order || i + 1,
            level: q.level || 1,
          },
        ])
        .select()
        .single();

      if (qError) {
        console.error("Insert question failed:", qError.message);
        continue;
      }

      if (!q.options || !Array.isArray(q.options) || q.options.length === 0) {
        console.error(`No options provided for question: ${q.question}`);
        continue;
      }

      let correctAnswerId = null;

      // Step 2: Insert answers and find the ID of the correct one
      for (const opt of q.options) {
        const { data: newAnswer, error: aError } = await supabase
          .from("answers")
          .insert([
            {
              text: opt.text,
              isCorrect: opt.isCorrect,
              question_id: question.id,
            },
          ])
          .select("id")
          .single();

        if (aError) {
          console.error(`Insert answer failed for question_id ${question.id}:`, aError.message);
          continue; // Skip to next option if this one fails
        }

        if (opt.isCorrect) {
          correctAnswerId = newAnswer.id;
        }
      }

      // Step 3: Update the question with the correct answer's ID
      if (correctAnswerId) {
        const { error: updateError } = await supabase
          .from("questions")
          .update({ correct_answer: correctAnswerId })
          .eq("id", question.id);

        if (updateError) {
          console.error(`Failed to update correct_answer for question_id ${question.id}:`, updateError.message);
        }
      }
    }

    res.json({ message: "Game created successfully", gameId: game.id });
  } catch (err) {
    console.error("Confirm game error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
// GET all games for the logged-in teacher
router.get("/getall", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Step 1: check if user is a teacher
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("role, id")
      .eq("id", userId)
      .single();

    if (userError || !userRecord) {
      return res.status(404).json({ error: "User not found" });
    }

    if (userRecord.role !== "teacher") {
      return res.status(403).json({ error: "Access denied. Only teachers can view games." });
    }

    // Step 2: find teacher record linked to this user
    const { data: teacher, error: teacherError } = await supabase
      .from("teachers")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (teacherError || !teacher) {
      return res.status(404).json({ error: "Teacher record not found" });
    }

    // Step 3: fetch all games for this teacher
    const { data: games, error: gamesError } = await supabase
      .from("games")
      .select("*")
      .eq("teacher_id", teacher.id)
      .order("created_at", { ascending: false });

    if (gamesError) {
      return res.status(400).json({ error: gamesError.message });
    }

    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// get a specific game by ID (teacher-only)
router.get("/:gameId", authenticate, async (req, res) => {
  try {
    const userId = 42;
    const { gameId } = req.params;

    // Step 1: check teacher role
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("role, id")
      .eq("id", userId)
      .single();

    if (userError || !userRecord || userRecord.role !== "teacher") {
      return res.status(403).json({ error: "Access denied. Only teachers can play games." });
    }

    // Step 2: confirm teacher record
    const { data: teacher, error: teacherError } = await supabase
      .from("teachers")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (teacherError || !teacher) {
      return res.status(404).json({ error: "Teacher record not found" });
    }

    // Step 3: fetch the game (must belong to this teacher)
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .eq("teacher_id", teacher.id)
      .single();

    if (gameError || !game) {
      return res.status(404).json({ error: "Game not found or not owned by you" });
    }

    // Step 4: fetch questions + answers
    const { data: questions, error: qError } = await supabase
      .from("questions")
      .select("id, question, level, order, answers!inner(id, text, isCorrect)")
      .eq("game_id", game.id);

    if (qError) {
      return res.status(400).json({ error: qError.message });
    }

    res.json({
      game,
      questions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// DELETE a game by ID (teacher-only, with CASCADE enabled)
router.delete("/:gameId", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { gameId } = req.params;

    // Step 1: check role
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("role, id")
      .eq("id", userId)
      .single();

    if (userError || !userRecord || userRecord.role !== "teacher") {
      return res.status(403).json({ error: "Access denied. Only teachers can delete games." });
    }

    // Step 2: find teacher record
    const { data: teacher, error: teacherError } = await supabase
      .from("teachers")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (teacherError || !teacher) {
      return res.status(404).json({ error: "Teacher record not found" });
    }

    // Step 3: verify game ownership
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id")
      .eq("id", gameId)
      .eq("teacher_id", teacher.id)
      .single();

    if (gameError || !game) {
      return res.status(404).json({ error: "Game not found or not owned by you" });
    }

    // Step 4: delete game (cascade will handle related rows)
    const { error: delError } = await supabase
      .from("games")
      .delete()
      .eq("id", gameId);

    if (delError) {
      return res.status(400).json({ error: delError.message });
    }

    res.json({ message: "Game and related data deleted successfully (CASCADE)." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// NEW ROUTE: 1️⃣ POST - generate MCQs from a PDF file (preview only)
router.post("/generate-from-pdf", authenticate, upload.single('pdfFile'), async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded." });
    }

    // Parse the PDF to extract text
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdf(dataBuffer);
    const pdfText = pdfData.text;

    // Clean up the uploaded file from the server
    fs.unlinkSync(req.file.path);

    if (!pdfText.trim()) {
      return res.status(400).json({ error: "Could not extract text from the PDF." });
    }

    // Check if the user is a teacher
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("role, id")
      .eq("id", userId)
      .single();

    if (userError || !userRecord || userRecord.role !== "teacher") {
      return res.status(403).json({ error: "Only teachers can generate MCQs." });
    }

    // Call the AI service with the extracted text
    const aiResponse = await axios.post(process.env.AI_SERVICE_URL, {
      text: pdfText,
    });

    const mcqs = aiResponse.data.mcqs;

    res.json({
      preview: mcqs,
      note: "This is a preview. You must confirm with POST /mygames/confirm.",
    });
  } catch (err) {
    console.error("Generate MCQs from PDF error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
