import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem("jwt_token");
        setIsLoggedIn(!!token);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("jwt_token");
        setIsLoggedIn(false);
        navigate("/login");
    };

    return (
        <div>
            <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: #f9f9f9;
        }

        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 60px;
          background-color: white;
          border-bottom: 1px solid #e5e5e5;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 20px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .logo-img {
          width: 40px;
          height: 40px;
          background: #1a1a1a;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 18px;
        }

        .nav {
          display: flex;
          gap: 40px;
          align-items: center;
          font-size: 18px;
        }

        .nav a {
          text-decoration: none;
          color: #1a1a1a;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.3s;
        }

        .nav a:hover {
          background-color: #1a1a1a;
          color: white;
        }

        /* Sign In / Logout - same style */
        .auth-button {
          background-color: #1a1a1a;
          color: white;
          border: none;
          padding: 10px 22px;
          border-radius: 50px;
          cursor: pointer;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          transition: background-color 0.3s, transform 0.2s;
        }

        .auth-button:hover {
          background-color: #333;
          transform: translateY(-2px);
        }

        /* Main content */
        main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 20px;
        }

        .hero-title {
          font-size: 48px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 60px;
          line-height: 1.3;
          color: #1a1a1a;
        }
      `}</style>

            {/* Header */}
            <header className="header">
                <div className="logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
                    <div className="logo-img">
                        <img src="/StudyAssistantLogo.jpg" alt="Study Assistant" />
                    </div>
                    <span>Study Assistant</span>
                </div>

                <nav className="nav">
                    <Link to="/">Home</Link>
                    <Link to="/courses">Courses</Link>
                    <Link to="/chat-sessions">Chat</Link>
                </nav>

                <div className="header-actions">
                    {isLoggedIn ? (
                        <button onClick={handleLogout} className="auth-button">
                            <span>👤</span>
                            Logout
                        </button>
                    ) : (
                        <button onClick={() => navigate("/login")} className="auth-button">
                            <span>👤</span>
                            Sign In
                        </button>
                    )}
                </div>
            </header>

            {/* Main content */}
            <main>
                {/* Chỉ hiển thị slogan ở trang Home */}
                {location.pathname === "/" && (
                    <h1 className="hero-title">
                        Knowledge isn’t found in books,<br />but in the way you journey with it.
                    </h1>
                )}

                {/* Render nội dung route con */}
                <Outlet />
            </main>
        </div>
    );
}

export default App;