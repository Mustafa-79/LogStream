import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

const GOOGLE_CLIENT_ID = "68897052946-698kit30b1s5bin6heshna24k32j9ekv.apps.googleusercontent.com"; // Replace with your client ID

const LoginContent = () => {
  const navigate = useNavigate();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });
        const profile = await res.json();
        if (profile.hd === "gosaas.io") {
          localStorage.setItem("auth_token", tokenResponse.access_token);
          localStorage.setItem("user_profile", JSON.stringify(profile)); // <-- store profile
          navigate("/dashboard", { replace: true });
        } else {
          alert("Only GoSaaS users can log in.");
        }
      } catch {
        alert("Login Failed");
      }
    },
    onError: () => alert("Login Failed"),
    flow: "implicit",
  });

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      justifyContent: "center",
      alignItems: "center",
      background: '#e5e5e5'
    }}>
      <div style={{
        background: "#fff",
        padding: "2rem 3rem",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        minWidth: '40rem',
        textAlign: "center",
        position: "relative"
      }}>
        <img src="/src/assets/GoSaas_Logo.jpg" alt="GoSaaS Logo" style={{ width: 200, marginBottom: 16 }} />
        <button onClick={() => login()} style={{
          width: "80%",
          background: "#3f51b5",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          padding: "12px 0",
          fontSize: 16,
          cursor: "pointer",
          marginBottom: 16
        }}>
          Sign in with Google
        </button>
        <div style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100%",
          height: 6,
          background: "#3f51b5",
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
          boxShadow: "0 2px 6px rgba(63,81,181,0.15)"
        }} />
      </div>
      <div style={{
        marginTop: 16,
        color: "#3f51b5",
        fontSize: 30,
        display: "flex",
        justifyContent: "center",
        width: 640
      }}>
        <span>LogStream</span>
      </div>
    </div>
  );
};

const Login = () => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <LoginContent />
  </GoogleOAuthProvider>
);

export default Login;