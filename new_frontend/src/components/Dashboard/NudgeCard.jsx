import React, { useState, useEffect } from "react";

const NudgeCard = () => {
  const [nudge, setNudge] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRandomDailyNudge = async () => {
      const today = new Date().toDateString();
      const cachedData = localStorage.getItem("dailyNudge");
      
      if (cachedData) {
        const { date, quote } = JSON.parse(cachedData);
        if (date === today) {
          setNudge(quote);
          setLoading(false);
          return;
        }
      }

      try {
        // Using a reliable free quotes API with CORS enabled
        const response = await fetch("https://dummyjson.com/quotes/random");
        const data = await response.json();
        const newNudge = `${data.quote} — ${data.author}`;
        
        localStorage.setItem(
          "dailyNudge",
          JSON.stringify({ date: today, quote: newNudge })
        );
        
        setNudge(newNudge);
      } catch (error) {
        console.error("Failed to fetch nudge:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRandomDailyNudge();
  }, []);

  return (
    <div className="nudge-card">
      <h3 className="card-heading">Daily Nudge</h3>
      <p className="card-text">{loading ? "Loading..." : nudge}</p>
    </div>
  );
};

export default NudgeCard;
