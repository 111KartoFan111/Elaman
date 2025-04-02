import React from "react";

const MatchCard = ({ match }) => {
  return (
    <div className="match-card">
      <h3>{match.teams.home} vs {match.teams.away}</h3>
      <p>{match.date}</p>
      {match.score ? (
        <p>Есеп: {match.score.home} - {match.score.away}</p>
      ) : (
        <p>Матч әлі болмаған</p>
      )}
    </div>
  );
};

export default MatchCard;