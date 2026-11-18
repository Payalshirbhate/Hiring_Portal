
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, ArrowRight } from "lucide-react";
import "../../styles/Hero.css";

function Hero() {
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (keyword.trim()) {
      params.set("search", keyword.trim());
    }

    if (location.trim()) {
      params.set("location", location.trim());
    }

    const query = params.toString();

    navigate(query ? `/jobs?${query}` : "/jobs");
  };

  return (
    <section className="hero">
      <div className="hero-content">

        <div className="hero-label">
          YOUR CAREER STARTS HERE
        </div>

        <h1>
          Find your next <span>opportunity.</span>
        </h1>

        <p>
          Explore exciting career opportunities and find
          the right role for your skills and ambitions.
        </p>

        <form className="search-box" onSubmit={handleSearch}>

          <div className="hero-search-field">
            <Search size={18} strokeWidth={1.8} />

            <input
              type="text"
              placeholder="Job title, keywords or department"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="hero-search-divider" />

          <div className="hero-search-field hero-location-field">
            <MapPin size={18} strokeWidth={1.8} />

            <input
              type="text"
              placeholder="City or location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <button type="submit">
            Search Jobs
            <ArrowRight size={16} />
          </button>

        </form>

        <div className="hero-bottom-text">
          Discover opportunities that move your career forward.
        </div>

      </div>
    </section>
  );
}

export default Hero;
