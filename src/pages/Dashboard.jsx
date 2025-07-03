import { useEffect, useState } from 'react';
import axios from 'axios';
import { URL } from '../constants/userConstants';
import { useNavigate } from 'react-router-dom';
import { API } from '@/actions/userAction';
import { extractFieldsFromCommentary } from '../utils/extractFromCommentary';

export default function Dashboard() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [filterValues, setFilterValues] = useState({});
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [filteredMatches, setFilteredMatches] = useState(matches); // assume `matches` is the full list


  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const res = await API.get(`${URL}/allmatches`);
        setMatches(res.data.matches || []);
      } catch (err) {
        console.error("Error fetching matches:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  useEffect(() => {
    if (matches?.length > 0 && selectedFilter) {
      const filtered = getFilteredMatches()
      setFilteredMatches(filtered);
    }
  }, [matches, selectedFilter])

  useEffect(() => {
    if (!editingItem) return;
    const { ballType, direction, shotType } = extractFieldsFromCommentary(editingItem.commText);
    setFilterValues(prev => ({
      ...prev,
      ...(ballType && { ballType }),
      ...(direction && { direction }),
      ...(shotType && { shotType }),
      ...(connection && { connection }),
      ...(keeperCatch && { keeperCatch })
    }));
  }, [editingItem]);

  const handleView = (match) => {
    // Navigate to match details page or perform any action
    console.log("Viewing match:", match);
    navigate(`/match/${match.matchId}`); // Assuming you have a route set up for match details
  };

  const filterMatches = (filterKey) => {
    setSelectedFilter(filterKey);
  };

  const currentDate = new Date();
  function getFilteredMatches() {
    const filtered = selectedFilter === 'all'
      ? matches
      : matches.filter(match => {
        const matchDate = new Date(match.date);
        const matchEndDate = new Date(match.enddate);
        if (selectedFilter === 'ongoing') {
          return matchDate <= currentDate && matchEndDate >= currentDate;
        } else if (selectedFilter === 'upcoming') {
          return matchDate > currentDate;
        } else if (selectedFilter === 'completed') {
          return match?.matchlive[0]?.result?.toLowerCase() === 'complete';
          //return matchEndDate < currentDate;
        } else if (selectedFilter === 'delayedOrAbandoned') {
          // Matches that are genuinely delayed or abandoned
          const isDelayedOrAbandoned = match.matchlive?.[0]?.result === 'delayed' || match.matchlive?.[0]?.result?.toLowerCase() === 'abandon';
          return isDelayedOrAbandoned;
        } else if (selectedFilter === 'notUpdated') {
          // Matches that are not updated due to Cricbuzz API key not working
          if (currentDate > matchDate) {
            const isNotUpdated = (!match.matchlive || !match.matchlive[0]?.result) || (currentDate > matchEndDate && !(match.matchlive?.[0]?.result?.toLowerCase() == 'complete' || match.matchlive?.[0]?.result?.toLowerCase() == 'abandon'));
            return isNotUpdated;
          }
          else {
            return false
          }
        }
        return false;
      });
    return filtered;
  }

  if (loading) {
    return <div className="p-8 text-center text-lg">Loading matches...</div>;
  }

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold mb-4">Cricket Matches</h1>
      <div className="flex justify-center flex-wrap gap-2 mb-4">
        {[
          { key: "notUpdated", label: "Not Updated" },
          { key: "all", label: "All Matches" },
          { key: "ongoing", label: "Ongoing" },
          { key: "upcoming", label: "Upcoming" },
          { key: "completed", label: "Completed" },
          { key: "delayedOrAbandoned", label: "Delayed or Abandoned" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => filterMatches(key)}
            className={`px-4 py-2 rounded font-semibold text-sm border 
        ${selectedFilter === key
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-blue-600 border-blue-600 hover:bg-blue-50"
              }
      `}
          >
            {label}
          </button>
        ))}
      </div>

      {filteredMatches?.map((match) => (
        <div
          key={match._id}
          className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row items-center gap-4"
        >
          {/* Teams */}
          <div className="flex items-center gap-4 flex-1">
            <div className="flex flex-col items-center">
              <img
                src={match.teamHomeFlagUrl}
                alt={match.teamHomeCode}
                className="w-12 h-12 object-contain mb-1"
              />
              <span className="text-sm font-semibold capitalize">{match.teamHomeName}</span>
              <span className="text-xs text-gray-500 uppercase">{match.teamHomeCode}</span>
            </div>
            <span className="text-lg font-bold text-gray-600">vs</span>
            <div className="flex flex-col items-center">
              <img
                src={match.teamAwayFlagUrl}
                alt={match.teamAwayCode}
                className="w-12 h-12 object-contain mb-1"
              />
              <span className="text-sm font-semibold capitalize">{match.teamAwayName}</span>
              <span className="text-xs text-gray-500 uppercase">{match.teamAwayCode}</span>
            </div>
          </div>
          {/* Match Info */}
          <div className="flex-1">
            <div className="font-bold text-base mb-1">{match.matchTitle}</div>
            <div className="text-xs text-gray-600 mb-1">
              Format: <span className="uppercase">{match.format}</span> | Type: {match.type?.toUpperCase()}
            </div>
            <div className="text-xs text-gray-600 mb-1">
              Start: {new Date(match.date).toLocaleString()} <br />
              End: {new Date(match.enddate).toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 mb-1">
              Series ID: <span className="font-mono">{match.seriesId}</span>
            </div>
            {/* Contest IDs */}
            <div className="mt-2">
              <div className="font-semibold text-sm mb-1">Contests:</div>
              <ul className="flex flex-wrap gap-2">
                {match.contestId && match.contestId.length > 0 ? (
                  match.contestId.map((cid) => (
                    <li
                      key={cid}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono"
                    >
                      {cid}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400 text-xs">No contests</li>
                )}
              </ul>
            </div>
            {/* View Button */}
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              onClick={() => handleView(match)} // Add your handler if needed
            >
              View
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}