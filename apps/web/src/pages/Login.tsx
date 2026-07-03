import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/auth";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("abhi@example.com");
  const [password, setPassword] = useState("Apos@123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await login(email, password);

      localStorage.setItem("token", result.data.token);
      localStorage.setItem("user", JSON.stringify(result.data.user));

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">

        <h1 className="mb-2 text-center text-4xl font-bold">
          AP OS
        </h1>

        <p className="mb-8 text-center text-slate-500">
          Construction ERP System
        </p>

        <div className="space-y-5">

          <div>
            <label className="mb-2 block font-medium">
              Email
            </label>

            <input
              type="email"
              className="w-full rounded-md border border-gray-300 p-3 outline-none focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Password
            </label>

            <input
              type="password"
              className="w-full rounded-md border border-gray-300 p-3 outline-none focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded bg-red-100 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-md bg-black py-3 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>

        </div>

      </div>
    </div>
  );
}