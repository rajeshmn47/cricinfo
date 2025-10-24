import React from 'react';

export default function MatchHeader({ match, matchLiveData }) {
  if (!match || !matchLiveData) {
    return <div className="bg-white rounded-lg shadow p-4 mb-6">Loading match details...</div>;
  }

  const getMatchDescription = () => {
    const format = match.format?.toUpperCase() || '';
    const venue = match.venue || 'TBC';
    return `${format} | ${venue}`;
  };

  const getCurrentScore = () => {
    if (matchLiveData.isHomeFirst) {
      return {
        team: match.teamHomeName,
        runs: matchLiveData.runFI,
        wickets: matchLiveData.wicketsFI,
        overs: matchLiveData.oversFI
      };
    } else {
      return {
        team: match.teamAwayName,
        runs: matchLiveData.runFI,
        wickets: matchLiveData.wicketsFI,
        overs: matchLiveData.oversFI
      };
    }
  };

  const currentScore = getCurrentScore();

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between text-gray-800">
        <div>
          <h2 className="font-bold text-xl">
            {match.teamHomeCode?.toUpperCase() || 'TBA'} vs {match.teamAwayCode?.toUpperCase() || 'TBA'}
          </h2>
          <p className="text-sm text-gray-500">{getMatchDescription()}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">
            {currentScore.team} {currentScore.runs || 0}/
            {currentScore.wickets || 0} ({currentScore.overs || 0})
          </p>
          {matchLiveData.target && (
            <p className="text-sm text-gray-600">
              Target: {matchLiveData.target}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}