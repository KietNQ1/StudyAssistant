import React, { useEffect } from "react";

function HomePage() {
    // Pause rotation on hover
    useEffect(() => {
        const rotatingContainer = document.getElementById("rotatingContainer");
        if (!rotatingContainer) return;

        const handleMouseEnter = () => rotatingContainer.classList.add("paused");
        const handleMouseLeave = () => rotatingContainer.classList.remove("paused");

        rotatingContainer.addEventListener("mouseenter", handleMouseEnter);
        rotatingContainer.addEventListener("mouseleave", handleMouseLeave);

        // Cleanup
        return () => {
            rotatingContainer.removeEventListener("mouseenter", handleMouseEnter);
            rotatingContainer.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, []);

    // Fade-in on scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) entry.target.classList.add("fade-in-visible");
                });
            },
            { threshold: 0.15 }
        );

        const fadeEls = document.querySelectorAll(".fade-in");
        fadeEls.forEach((el) => observer.observe(el));

        return () => fadeEls.forEach((el) => observer.unobserve(el));
    }, []);

    return (
        <div>
            <style>{`
        /* 🌐 General setup */
        .rotating-section {
          position: relative;
          width: 500px;
          height: 500px;
          margin: 60px auto 100px;
        }

        .center-logo {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 150px;
          height: 150px;
          background: white;
          border-radius: 50%;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          border: 3px solid #1a1a1a;
        }

        .center-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* ⚙️ Rotation setup */
        .rotating-container {
          position: relative;
          width: 100%;
          height: 100%;
          animation: rotate 20s linear infinite;
          transform-origin: center center;
        }

        .rotating-container.paused { animation-play-state: paused; }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .icon-circle {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 120px;
          height: 120px;
          margin: -60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
          transition: transform 0.3s, filter 0.3s;
          overflow: hidden;
          background: white;
          text-decoration: none;
        }

        .icon-circle img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .icon-content {
          animation: counterRotate 20s linear infinite;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
@keyframes counterRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }

        .rotating-container.paused .icon-content {
          animation-play-state: paused;
        }

        /* 🌈 Position icons evenly around circle */
        .icon-1 { background-color: #4A90E2; transform: rotate(0deg) translate(190px) rotate(0deg); }
        .icon-2 { background-color: #E74C3C; transform: rotate(72deg) translate(190px) rotate(-72deg); }
        .icon-3 { background-color: #8B5CF6; transform: rotate(144deg) translate(190px) rotate(-144deg); }
        .icon-4 { background-color: #F39C12; transform: rotate(216deg) translate(190px) rotate(-216deg); }
        .icon-5 { background-color: #27AE60; transform: rotate(288deg) translate(190px) rotate(-288deg); }

        .rotating-container:not(.paused) .icon-circle:hover {
          filter: brightness(1.2);
          transform: scale(1.05);
        }

        /* 🧠 Feature sections */
        .feature-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 50px;
          margin-bottom: 80px;
          opacity: 0;
          transform: translateY(40px);
          transition: all 0.8s ease;
        }

        .feature-section.fade-in-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .feature-section.reverse { flex-direction: row-reverse; }

        .feature-text { flex: 1; }

        .feature-title {
          font-size: 26px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .feature-description {
          color: #555;
          font-size: 16px;
          line-height: 1.7;
        }

        .feature-preview {
          flex: 1.3;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          border-radius: 16px;
          padding: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 280px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .preview-card {
          background-color: #2a2a2a;
          border-radius: 12px;
          padding: 30px;
          color: white;
          text-align: center;
          transition: transform 0.3s;
        }

        .preview-card:hover { transform: translateY(-5px); }

        .emoji { font-size: 40px; margin-bottom: 12px; }
        .label { color: #aaa; font-size: 14px; margin-bottom: 8px; }
        .card-title { font-size: 34px; font-weight: 700; color: #9FEF00; }

        .cursor {
          font-size: 40px;
          display: block;
          margin-top: 10px;
          animation: clickPulse 2s ease-in-out infinite;
        }

        @keyframes clickPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
50% { transform: scale(1.1); opacity: 0.8; }
        }

        @media (max-width: 768px) {
          .feature-section { flex-direction: column; text-align: center; }
          .rotating-section { width: 350px; height: 350px; }
          .icon-circle { width: 80px; height: 80px; font-size: 32px; }
        }
      `}</style>

            {/* 🎡 Rotating Logo Section */}
            <div className="rotating-section">
                <div className="center-logo">
                    <img src="/StudyAssistantLogo.jpg" alt="Study Assistant Logo" />
                </div>
                <div className="rotating-container" id="rotatingContainer">
                    <a href="/courses" className="icon-circle icon-1">
                        <div className="icon-content">
                            <img src="/Course.jpg" alt="Courses" />
                        </div>
                    </a>
                    <a href="/documents" className="icon-circle icon-2">
                        <div className="icon-content">
                            <img src="/UpFile.jpg" alt="Upload Documents" />
                        </div>
                    </a>
                    <a href="/flashcards" className="icon-circle icon-3">
                        <div className="icon-content">
                            <img src="/FlashCard.jpg" alt="Flashcards" />
                        </div>
                    </a>
                    <a href="/quizzes" className="icon-circle icon-4">
                        <div className="icon-content">
                            <img src="/Quiz.jpg" alt="Quizzes" />
                        </div>
                    </a>
                    <a href="/chat" className="icon-circle icon-5">
                        <div className="icon-content">
                            <img src="/AIChat.jpg" alt="AI Chat" />
                        </div>
                    </a>
                </div>
            </div>

            {/* 📘 Features */}
            <FeatureSection
                emoji="📓"
                title="Upload Your Learning Materials"
                description="Upload PDFs, YouTube videos, or slides — Study Assistant summarizes and extracts insights so you can focus on understanding, not just reading."
                label="Notebook"
                tag="LITERATURE"
            />

            <FeatureSection
                emoji="🎴"
                title="AI-Generated Flashcards"
                description="Let AI automatically turn your content into smart, spaced-repetition flashcards — the science-backed way to retain knowledge efficiently."
                label="Flashcards"
                tag="THEORY"
                reverse
            />

            <FeatureSection
                emoji="🤖"
                title="Chat With Your Knowledge"
                description="Ask AI anything based on your materials. Get detailed explanations, examples, and connections between topics — like having a personal tutor 24/7."
                label="AI Chat"
                tag="Q&A"
            />
        </div>
    );
}

/* 🧩 Reusable Section Component */
function FeatureSection({ emoji, title, description, label, tag, reverse }) {
    return (
        <div className={`feature-section fade-in ${reverse ? "reverse" : ""}`}>
            <div className="feature-text">
                <h2 className="feature-title">
                    <span>{emoji}</span> {title}
                </h2>
                <p className="feature-description">{description}</p>
            </div>
            <div className="feature-preview">
                <div className="preview-card">
                    <div className="emoji">{emoji}</div>
                    <div className="label">{label}</div>
                    <div className="card-title">{tag}</div>
                    <div className="cursor">👆</div>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
