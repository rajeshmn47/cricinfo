import { useState } from 'react';

export default function ScorecardSection({ matchDetails }) {
  const [activeInnings, setActiveInnings] = useState('first');

  if (!matchDetails) {
    return <div>Loading...</div>;
  }

  const renderBattingStats = (players) => (
    <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-100">
          <th className="p-2 text-left">Batter</th>
          <th className="p-2">Runs</th>
          <th className="p-2">Balls</th>
          <th className="p-2">4s</th>
          <th className="p-2">6s</th>
          <th className="p-2">SR</th>
        </tr>
      </thead>
      <tbody>
        {players
          .map(player => (
            <tr key={player.playerId} className="border-b">
              <td className="p-2">
                {player.playerName}
                {player.howOut && <small className="block text-gray-500">{player.howOut}</small>}
              </td>
              <td className="p-2 text-center">{player.runs}</td>
              <td className="p-2 text-center">{player.balls}</td>
              <td className="p-2 text-center">{player.fours}</td>
              <td className="p-2 text-center">{player.sixes}</td>
              <td className="p-2 text-center">{player.strikeRate.toFixed(2)}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );

  const renderBowlingStats = (players) => (
    <table className="w-full border-collapse mt-4">
      <thead>
        <tr className="bg-gray-100">
          <th className="p-2 text-left">Bowler</th>
          <th className="p-2">O</th>
          <th className="p-2">M</th>
          <th className="p-2">R</th>
          <th className="p-2">W</th>
          <th className="p-2">Econ</th>
        </tr>
      </thead>
      <tbody>
        {players
          .filter(player => player.overs > 0)
          .map(player => (
            <tr key={player.playerId} className="border-b">
              <td className="p-2">{player.playerName}</td>
              <td className="p-2 text-center">{player.overs}</td>
              <td className="p-2 text-center">{player.maidens}</td>
              <td className="p-2 text-center">{player.runsConceded}</td>
              <td className="p-2 text-center">{player.wickets}</td>
              <td className="p-2 text-center">{player.economy.toFixed(2)}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );

  const firstInningsTeam = matchDetails.isHomeFirst 
    ? matchDetails.teamHomePlayers 
    : matchDetails.teamAwayPlayers;
  
  const secondInningsTeam = matchDetails.isHomeFirst 
    ? matchDetails.teamAwayPlayers 
    : matchDetails.teamHomePlayers;

  return (
    <div className="mx-auto p-4">
      <div className="mb-4 flex gap-4">
        <button
          className={`px-4 py-2 rounded ${activeInnings === 'first' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveInnings('first')}
        >
          1st Innings
        </button>
        <button
          className={`px-4 py-2 rounded ${activeInnings === 'second' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setActiveInnings('second')}
        >
          2nd Innings
        </button>
      </div>

      {activeInnings === 'first' ? (
        <div>
          <h3 className="text-xl font-bold mb-2">
            {matchDetails.titleFI} {matchDetails.runFI}/{matchDetails.wicketsFI} ({matchDetails.oversFI} ov)
          </h3>
          {renderBattingStats(firstInningsTeam)}
          {renderBowlingStats(secondInningsTeam)}
          {matchDetails.extrasDetailFI && (
            <p className="mt-2 text-sm">Extras: {matchDetails.extrasDetailFI}</p>
          )}
          {matchDetails.fowFI && (
            <p className="mt-2 text-sm">Fall of wickets: {matchDetails.fowFI}</p>
          )}
        </div>
      ) : (
        <div>
          <h3 className="text-xl font-bold mb-2">
            {matchDetails.titleSI} {matchDetails.runSI}/{matchDetails.wicketsSI} ({matchDetails.oversSI} ov)
          </h3>
          {renderBattingStats(secondInningsTeam)}
          {renderBowlingStats(firstInningsTeam)}
          {matchDetails.extrasDetailSI && (
            <p className="mt-2 text-sm">Extras: {matchDetails.extrasDetailSI}</p>
          )}
          {matchDetails.fowSI && (
            <p className="mt-2 text-sm">Fall of wickets: {matchDetails.fowSI}</p>
          )}
        </div>
      )}
    </div>
  );
}