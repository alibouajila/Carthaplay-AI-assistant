module.exports = function authenticate(req, res, next) {
  // Simple stub: check Authorization header for Bearer token and attach a dummy user.
  // Replace this with real JWT verification or Supabase auth in production.
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  const token = auth.slice(7);
  // For now accept any non-empty token and attach a dummy user.
  if (!token) return res.status(401).json({ error: "Invalid token" });

  // Dummy user; in real app decode token and fetch user info
  req.user = { id: 'anonymous', role: 'teacher' };
  next();
};
