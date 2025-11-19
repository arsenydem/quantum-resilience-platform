import Login from "../components/Login";

export default function LoginPage() {
  return <Login onLogin={() => window.location.href = "/platform"} />;
}