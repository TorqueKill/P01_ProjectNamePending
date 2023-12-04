const express = require('express');

const router = express.Router();

module.exports = function(supabase) {

  // Signup route
  router.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    try {
      const { user, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ user });
    } catch (error) {
      console.error('Error:', error.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Signin route 
  router.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    try {
      const { user, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      return res.status(200).json({ user });
    } catch (error) {
      console.error('Error:', error.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Signout route
  router.post('/signout', async (req, res) => {
    try {
      const { error } = await supabase.auth.signOut();
  
      if (error) {
        console.error('Error signing out:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
  

      return res.status(200).json({ message: 'User signed out successfully' });
    } catch (error) {

      console.error('Error:', error.message);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

  return router;
};
