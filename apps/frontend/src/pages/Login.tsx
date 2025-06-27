import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

const GOOGLE_CLIENT_ID = "68897052946-qov2lsf2ga6sb9fuqpk0ruk8nkgsuj6n.apps.googleusercontent.com"; // Replace with your client ID

const LoginContent = () => {
  const navigate = useNavigate();

  const login = useGoogleLogin({
  onSuccess: async (tokenResponse) => {
    try {
      // Send Google access token to your API Gateway
      const res = await fetch("http://localhost:3000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: tokenResponse.access_token }),
      });
      if (!res.ok) throw new Error("Login Failed");
      const { jwt } = await res.json();
      sessionStorage.setItem("auth_token", jwt);
      // Optionally, check isAdmin in user_profile or jwt payload
      navigate("/dashboard", { replace: true });
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