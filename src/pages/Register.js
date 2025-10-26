import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/*
  Register.js
  - Lightweight redirect helper so /register can open the flippable Login page
    already showing the register side by adding ?mode=register to the /login route.
  - This avoids duplicating the full UI and gives a nice route for register links.
*/

const Register = () => {
  const navigate = useNavigate();
  useEffect(() => {
    // Redirect to /login but open the register side of the card
    navigate("/login?mode=register", { replace: true });
  }, [navigate]);

  return null;
};

export default Register;
