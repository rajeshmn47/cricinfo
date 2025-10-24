import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import EditCommentaryModal from "./EditCommentaryModal";
import { db } from '../firebase';
import { collection, doc, query, getDoc, orderBy, onSnapshot } from 'firebase/firestore';
import { URL, VIDEO_URL } from "@/constants/userConstants";
import { API } from "@/actions/userAction";

export default function CommentarySection() {
    const { id } = useParams();
    const [commentary, setCommentary] = useState([]);
    const [activeTab, setActiveTab] = useState('commentary');
    const [loading, setLoading] = useState(true);
    // Modal state for editing video link
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [newVideoLink, setNewVideoLink] = useState('');
    const [filterValues, setFilterValues] = useState({});
    // Add state for fetched clips
    const [clips, setClips] = useState([]);
    const [clipsLoading, setClipsLoading] = useState(false);
    const [inputCommentary, setInputCommentary] = useState({});
    const [selectedDirection, setSelectedDirection] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const directions = [
        "Third Man",
        "Fine Leg",
        "Square Leg",
        "Deep Square Leg",
        "Mid Wicket",
        "Deep Mid Wicket",
        "Long On",
        "Long Off",
        "Cover",
        "Extra Cover",
        "Point",
        "Deep Point",
        "Gully",
        "Slip",
        "Backward Point",
        "Mid Off",
        "Mid On",
        "Short Fine Leg",
        "Short Third Man",
        "Long Leg",
        "Deep Cover",
        "Deep Extra Cover"
    ];
      useEffect(() => {
        if (!id) return;
        const q = query(
          collection(db, 'matches', id, 'commentary'),
          orderBy('timestamp', 'desc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const comms = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setCommentary(comms);
          setLoading(false);
        });
        return () => unsubscribe();
      }, [id]);
    
      useEffect(() => {
        async function getdata() {
          if (id) {
            const docRef = doc(db, 'commentary', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
            } else {
              // docSnap.data() will be undefined in this case
            }
            const unsub = onSnapshot(
              doc(db, 'commentary', id),
              (doc) => {
                if (doc.data()) {
                  setCommentary([...doc.data().commentary.reverse()]);
                }
              },
            );
          }
        }
        getdata();
        // onSnapshot((docRef, "cities"), (snapshot) => {
        // let array = []; // Get users all recent talks and render that in leftColumn content
        // console.log(snapshot, "snaps");
        // });
      }, [id]);
    const closeModal = () => {
        setModalOpen(false);
        setEditingItem(null);
        setNewVideoLink('');
    };
    const handleSave = async () => {
        if (!editingItem) return;
        try {
            // Prepare your data
            const commentaryRef = doc(db, "commentary", id); // id should be match id from useParams or state
            console.log(commentary)
            let commentaryData = commentary.map((item) => editingItem.timestamp == item.timestamp ? { ...item, videoLink: newVideoLink } : item);
            console.log(commentaryData, 'commentaryData');
            console.log(editingItem, 'feditingItem')
            const docSnap = await getDoc(commentaryRef);
            let data;
            if (docSnap.exists()) {
                // Access data fields like docSnap.data().commentary
                data = docSnap.data();
            } else {
                // Document does not exist
                data = { commentary: [], livedata: "", miniscore: {} };
            }
            console.log(data, 'data from docSnap');
            const livedata = data?.livedata; // your match data object
            const miniscore = data?.miniscore; // your miniscore object

            await setDoc(
                commentaryRef,
                {
                    commentary: [...commentaryData],
                    livedata: livedata || "",
                    miniscore: miniscore,
                },
                { merge: true }
            );
            console.log(commentaryData, 'Commentary updated successfully');
            // Optionally show success message or close modal
            setModalOpen(false);
            // Optionally refresh data or show notification
        } catch (error) {
            console.error("Error updating commentary:", error);
            // Optionally show error notification
        }
    };
    const handleFilterChange = (key, value) => {
        setFilterValues((prev) => ({ ...prev, [key]: value }))
    }
     const filteredClips = clips.filter((clip) => clip.event === inputCommentary?.event)
        .filter((clip) => {
          return Object.entries(filterValues).every(([key, value]) => {
            if (!value) return true;
            const clipValue = clip[key];
            const commentary = clip?.commentary?.toLowerCase()
            // Semantic matching for shotType, direction, ballType
            if (["shotType", "direction", "ballType", "isCleanBowled"].includes(key)) {
              if (key == "isCleanBowled") {
                value = "isCleanBowled"
              }
              return (
                matchesWithSynonyms(commentary, value, key)
              );
            }
            if (searchTerm) {
              if (commentary?.includes(searchTerm)) {
                return true;
              }
              else {
                return false;
              }
            }
            // Keeper Catch filter logic
            if (key === 'isKeeperCatch') {
              const keeperCatchSynonyms = cricketSynonyms.keeperCatch?.keeper_catch || [];
              const catches = keeperCatchSynonyms.some(syn =>
                clip.commentary?.toLowerCase().includes(syn.toLowerCase())
              );
              if (clip?.event?.toLowerCase() == "wicket") {
                console.log(catches, clip?.commentary, 'catches');
                return catches;
              }
              else {
                return false;
              }
            }
            if (key === 'caughtBy') {
              console.log('caught by is selected')
              let values = value?.split(" ")
              if (clip?.commentary?.toLowerCase().includes(`caught by ${values[1]?.toLowerCase()}`) || clip?.commentary?.toLowerCase().includes(`caught by ${values[0]?.toLowerCase()}`)) {
                if (clip?.batsman?.toLowerCase() == value?.toLowerCase()) {
                  return false;
                }
                if (clip?.bowler?.toLowerCase() == value?.toLowerCase()) {
                  return false;
                }
                else {
                  return true;
                }
              }
              else {
                return false;
              }
            }
            if (key === 'isWicket') return clip.event === 'WICKET';
            if (key === 'isFour') return clip.event.includes('FOUR');
            if (key === 'isSix') return clip.event === 'SIX';
            if (key === 'isLofted') {
              // Only filter if isLofted is true
              if (!value) return true;
              const comm = clip.commentary?.toLowerCase() || "";
              const shotType = clip.shotType?.toLowerCase() || "";
              // Synonyms for lofted
              const loftedSynonyms = cricketSynonyms.shotType?.lofted || [];
              // Match in commentary or shotType
              return (
                loftedSynonyms.some(syn => comm.includes(syn) || shotType.includes(syn))
              );
            }
            if (key === 'isGrounded') {
              if (!value) return true;
              const comm = clip.commentary?.toLowerCase() || "";
              const shotType = clip.shotType?.toLowerCase() || "";
              // Synonyms for grounded shots
              const groundedSynonyms = [
                "along the ground",
                "kept it down",
                "keeps it down",
                "kept on the ground",
                "along ground",
                "grounded",
                "kept low",
                "keeps it low"
              ];
              // Should NOT match any lofted synonyms
              const loftedSynonyms = cricketSynonyms.shotType?.lofted || [];
              // Must match a grounded synonym and NOT a lofted synonym
              return (
                groundedSynonyms.some(syn => comm.includes(syn) || shotType.includes(syn)) ||
                !loftedSynonyms.some(syn => comm.includes(syn) || shotType.includes(syn))
              );
            }
    
            // Example for duration range (adjust as per your data)
            if (key === 'durationRange') {
              const duration = clip.duration;
              if (value === '0-2') return duration >= 0 && duration < 2;
              if (value === '2-5') return duration >= 2 && duration < 5;
              if (value === '5-10') return duration >= 5 && duration < 10;
              if (value === '10+') return duration >= 10;
              return true;
            }
    
            if (key === 'isRunout') {
              return commentary?.includes('run out');
            }
    
            // Additional semantic matching for runOutBy
            if (key === 'runOutBy') {
              // Only filter if isRunout is also selected
              if (!filterValues.isRunout) return true;
              let values = value?.split(" ");
              const runOutByValue = values[1]?.toLowerCase();
              // Try to match in a dedicated runOutBy field if present
              //if (clip.runOutBy && clip.runOutBy.toLowerCase().includes(runOutByValue)) return true;
              // Fallback: try to match in commentary
              if (clip.commentary?.toLowerCase().includes(`direct hit by ${runOutByValue}`)) return true;
              if (clip.commentary?.toLowerCase().includes(`direct-hit from ${runOutByValue}`)) return true;
              // Optionally, match just the name if commentary is inconsistent
              //if (clip.commentary?.toLowerCase().includes(runOutByValue)) return true;
              return false;
            }
            if (key === 'isDropped') {
              return clip.event?.includes('DROPPED');
            }
            if (key === 'droppedBy') {
              if (!filterValues.isDropped) return true;
              const droppedByValue = value?.split(" ")?.[0]?.toLowerCase();
              const droppedByValue2 = value?.split(" ")?.[1]?.toLowerCase();
              // Try to match in a dedicated droppedBy field if present
              //if (clip.droppedBy && clip.droppedBy.toLowerCase().includes(droppedByValue)) return true;
              // Fallback: try to match in commentary
              if (clip.commentary?.toLowerCase().includes(`${droppedByValue}`)) return true;
              // Optionally, match just the name if commentary is inconsistent
              if (clip.commentary?.toLowerCase().includes(droppedByValue)) return true;
              if (clip.commentary?.toLowerCase().includes(`${droppedByValue2}`)) return true;
              // Optionally, match just the name if commentary is inconsistent
              if (clip.commentary?.toLowerCase().includes(droppedByValue2)) return true;
              return false;
            }
    
            // Default: string includes (case-insensitive)
            return clipValue && String(clipValue).toLowerCase().includes(String(value).toLowerCase());
          });
        });
    
      const handleReport = async (clipLink) => {
        await API.post(`${URL}/clips/report`, { clipId: clipLink })
      }

    return (
        <div className="mx-auto bg-blue-50 rounded-xl h-full overflow-y-auto">
            <h2 className="font-bold text-2xl mb-6 ml-2">Live Commentary</h2>

            {/* Directions Options */}
            <div className="mb-6 ml-2">
                <label className="block font-semibold mb-2">Directions:</label>
                <div className="flex flex-wrap gap-2">
                    {directions.map(dir => (
                        <span
                            key={dir}
                            className="px-3 py-1 bg-gray-200 rounded text-sm text-gray-700"
                        >
                            {dir}
                        </span>
                    ))}
                </div>
            </div>

            <div className="mx-auto">
                {commentary.length > 0 ? (
                    commentary.map((item) =>
                        item.event === 'over-break' ? (
                            <div
                                key={item.timestamp}
                                className="my-6 mx-2 p-4 flex justify-between bg-blue-100 border sm:mx-4 border-blue-200 rounded-lg shadow-sm"
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-xs text-gray-500 mt-1">{item.overNumber}</span>
                                    <p
                                        className="truncate text-blue-700 text-sm m-0"
                                        style={{ width: 700, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                    >
                                        {item.commText}
                                    </p>
                                    {item.videoLink && (
                                        <video
                                            className="w-48 max-h-32 rounded-lg shadow transition-shadow hover:shadow-lg"
                                            controls
                                            muted
                                        >
                                            <source src={`${VIDEO_URL}/mockvideos/${item.videoLink}`} type="video/mp4" />
                                        </video>
                                    )}
                                </div>
                                <div className="flex items-center justify-between px-6 mx-2" style={{ maxWidth: 900 }}>
                                    <button
                                        className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm whitespace-nowrap"
                                        style={{ whiteSpace: 'nowrap' }}
                                        onClick={() => openEditModal(item)}
                                    >
                                        Edit Video Link
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className='bg-white rounded-lg shadow mb-4 mx-2 sm:mx-4 px-2 sm:px-4 py-3 '>
                                <div
                                    key={item.timestamp}
                                    className="flex items-start flex-col sm:flex-row transition-shadow"
                                    style={{ maxWidth: 900 }}
                                >
                                    <div className="flex flex-col items-center justify-center pr-4 min-w-[38px]">
                                        <div className="flex justify-center items-center font-sans">
                                            {item.event === 'WICKET' ? (
                                                <span className="w-7 h-7 flex items-center justify-center rounded-full bg-red-600 text-white font-bold text-base shadow-md">
                                                    W
                                                </span>
                                            ) : item.event === 'FOUR' ? (
                                                <span className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-900 text-white font-bold text-base shadow-md">
                                                    4
                                                </span>
                                            ) : item.event === 'SIX' ? (
                                                <span className="w-7 h-7 flex items-center justify-center rounded-full bg-green-700 text-white font-bold text-base shadow-md">
                                                    6
                                                </span>
                                            ) : null}
                                        </div>
                                        <span className="text-xs text-gray-500 mt-1">{item.overNumber}</span>
                                    </div>
                                    <div className="flex flex-1 sm:items-center justify-between gap-4 flex-col sm:flex-row text-left">
                                        <div
                                            className="text-left leading-6 text-base text-gray-900 font-sans w-5/6 flex items-start gap-4"
                                        >
                                            <span className="">{item.commText}</span>
                                        </div>
                                        <div className='flex flex-col flex-end'>
                                            <button
                                                className="ml-0 mb-2 w-28 sm:ml-4 px-2 sm:px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm self-start whitespace-nowrap"
                                                style={{ whiteSpace: 'nowrap' }}
                                                onClick={() => openEditModal(item)}
                                            >
                                                Edit Video Link
                                            </button>
                                            {item?.videoLink && <button
                                                className="ml-0  w-28 sm:ml-4 px-2 sm:px-3 py-1 bg-red-400 text-white rounded hover:bg-red-700 text-sm self-start whitespace-nowrap"
                                                style={{ whiteSpace: 'nowrap' }}
                                                onClick={() => handleReport(item?.videoLink)}
                                            >
                                                Report
                                            </button>}
                                        </div>
                                    </div>
                                </div>

                                <div className=''>
                                    {item.videoLink && (
                                        <>{item?.breakdown &&
                                            <div className="flex flex-wrap items-center text-sm text-gray-700 gap-x-4 gap-y-2 my-2 mb-3">
                                                <strong className=" text-gray-600">Score Breakdown:</strong>
                                                {Object.entries(item.breakdown).map(([key, value]) => (
                                                    <div
                                                        key={key}
                                                        className="bg-gray-100 px-3 py-1 rounded-full shadow-sm border text-xs text-gray-800"
                                                    >
                                                        {key.replace(/([A-Z])/g, ' $1')}: <strong>{value}</strong>
                                                    </div>
                                                ))}
                                            </div>}
                                            <video
                                                className="w-full sm:w-48 sm:max-h-32 rounded-lg shadow transition-shadow hover:shadow-lg"
                                                controls
                                                muted
                                            >
                                                <source src={`${VIDEO_URL}/mockvideos/${item.videoLink}`} type="video/mp4" />
                                            </video>
                                        </>
                                    )}</div>
                            </div>
                        )
                    )
                ) : (
                    <div className="text-gray-500 text-center py-8">No commentary available.</div>
                )}
            </div>

            {/* Modal */}

            <EditCommentaryModal
                open={modalOpen}
                onClose={closeModal}
                onSave={handleSave}
                inputCommentary={inputCommentary}
                setInputCommentary={setInputCommentary}
                filterValues={filterValues}
                handleFilterChange={handleFilterChange}
                clips={clips}
                filteredClips={filteredClips}
                clipsLoading={clipsLoading}
                newVideoLink={newVideoLink}
                setNewVideoLink={setNewVideoLink}
                loading={loading}
                setSearchTerm={setSearchTerm}
                searchTerm={searchTerm}
            />
        </div>
    )
}