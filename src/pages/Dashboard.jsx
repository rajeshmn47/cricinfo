import { useEffect, useState } from 'react';
import axios from 'axios';
import { URL } from '../constants/userConstants';
import { useNavigate } from 'react-router-dom';
import { API } from '@/actions/userAction';
import { extractFieldsFromCommentary } from '../utils/extractFromCommentary';
import { ExternalLink } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [filterValues, setFilterValues] = useState({});
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [filteredMatches, setFilteredMatches] = useState(matches); // assume `matches` is the full list
  const [selectedMatchType, setSelectedMatchType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeries, setSelectedSeries] = useState("all");
  const matchTypeOptions = ['odi', 't20', 'test', 't10'];
  const categoryOptions = ['i', 'd', 'l'];
  const [important, setImportant] = useState('all');
  const [seriesOptions, setSeriesOptions] = useState([]);



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
    const fetchSeriesList = async () => {
      try {
        const res = await API.get(`${URL}/api/match/series/all`);
        setSeriesOptions(res.data || []);
      } catch (error) {
        console.error("Error fetching series list:", error);
      }
    };
    fetchSeriesList();
  }, []);

  useEffect(() => {
    if (matches?.length > 0 && (selectedFilter || selectedMatchType || selectedCategory)) {
      const filtered = getFilteredMatches()
      setFilteredMatches(filtered);
    }
  }, [matches, selectedFilter, selectedMatchType, selectedCategory, selectedSeries])

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
    window.open(`/match/${match.matchId}`, '_blank');
  };

  const filterMatches = (filterKey) => {
    setSelectedFilter(filterKey);
  };

  const currentDate = new Date();

  function getFilteredMatches2() {
    console.log("filtering", selectedCategory, selectedMatchType)
    const filtered = selectedFilter === 'all'
      ? matches.filter(match => {
        if (match.format === selectedMatchType || match.type === selectedCategory) {
          return true;
        }
        //else return true
      }
      )
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
        else if (selectedMatchType && match.format == selectedMatchType) {
          console.log("filtering", match?.type, selectedCategory, match?.format, selectedMatchType)
          return true;
        }
        else if (selectedCategory && match.type == selectedCategory) {
          console.log("filtering", match?.type, selectedCategory, match?.format, selectedMatchType)
          return true;
        }
        return false;
      });
    return filtered;
  }

  function getFilteredMatches() {
    return matches.filter(match => {
      const matchDate = new Date(match.date);
      const matchEndDate = new Date(match.enddate);
      const result = match?.matchlive?.[0]?.result?.toLowerCase();

      // Apply match status filter
      if (selectedFilter === 'ongoing') {
        if (!(matchDate <= currentDate && matchEndDate >= currentDate)) return false;
      } else if (selectedFilter === 'upcoming') {
        if (!(matchDate > currentDate)) return false;
      } else if (selectedFilter === 'completed') {
        if (result !== 'complete') return false;
      } else if (selectedFilter === 'delayedOrAbandoned') {
        if (!(result === 'delayed' || result === 'abandon')) return false;
      } else if (selectedFilter === 'notUpdated') {
        const isNotUpdated = (!match.matchlive || !result) ||
          (currentDate > matchEndDate && !(result === 'complete' || result === 'abandon'));
        if (!isNotUpdated) return false;
      }

      // Apply match type filter
      if (selectedMatchType !== 'all' && match.format !== selectedMatchType) return false;

      // Apply category filter
      if (selectedCategory !== 'all' && match.type !== selectedCategory) return false;

      // Apply series filter
      if (selectedSeries !== 'all' && match.seriesId !== selectedSeries) return false;

      return true;
    });
  }


  if (loading) {
    return <div className="p-8 text-center text-lg">Loading matches...</div>;
  }

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold mb-4">Cricket Matches</h1>
      <div className="flex justify-start gap-2 flex-wrap mb-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Series</label>
          <select
            value={selectedSeries}
            onChange={(e) => setSelectedSeries(e.target.value)}
            className="border rounded px-2 py-2 mr-2"
          >
            <option value="all">All Series</option>
            {seriesOptions.map((s) => (
              <option key={s._id} value={s?.seriesId}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Match Type</label>
          <select
            value={selectedMatchType}
            onChange={(e) => setSelectedMatchType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All</option>
            <option value="t20">T20</option>
            <option value="odi">ODI</option>
            <option value="test">Test</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All</option>
            <option value="i">International</option>
            <option value="d">Domestic</option>
            <option value="l">T20 League</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Important</label>
          <select
            value={important}
            onChange={(e) => setImportant(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All</option>
            <option value={important}>Yes</option>
            <option value={important}>No</option>
          </select>
        </div>
      </div>
      <div className='flex justify-start'>
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
            className={`px-4 py-1 rounded font-semibold text-sm border h-[40px] mr-2
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
              className="mt-4 px-2 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center justify-between"
              onClick={() => handleView(match)} // Add your handler if needed
            >
              view
              <ExternalLink className="inline ml-2" size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}