import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./Candidates.css";
import BASE_URL from "../api";

export default function Candidates() {

    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const CARDS_PER_PAGE = 6;

    useEffect(() => {
        // Sorted by profile completeness score, low-completeness profiles (<50)
        // already excluded server-side.
        fetch(`${BASE_URL}/profiles/topProfiles`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error();
                return res.json();
            })
            .then(data => setProfiles(data || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const filteredProfiles = useMemo(() => {
        const query = search.toLowerCase().trim();

        if (!query) return profiles;

        return profiles.filter(profile => {
            const name = profile.name?.toLowerCase() || "";
            const title = profile.jobTitle?.toLowerCase() || "";
            const company = profile.company?.toLowerCase() || "";
            const location = profile.location?.toLowerCase() || "";
            const skills = profile.skills?.join(" ").toLowerCase() || "";

            return (
                name.includes(query) ||
                title.includes(query) ||
                company.includes(query) ||
                location.includes(query) ||
                skills.includes(query)
            );
        });

    }, [profiles, search]);

    const totalPages = Math.max(1, Math.ceil(filteredProfiles.length / CARDS_PER_PAGE));

    const displayedProfiles = filteredProfiles.slice(
        (currentPage - 1) * CARDS_PER_PAGE,
        currentPage * CARDS_PER_PAGE
    );

    function getInitials(name) {
        if (!name) return "?";


        return name
            .split(" ")
            .map(word => word[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();


    }

    return (<div className="cand-page"> <Navbar />

        <main className="cand-main">

            <div className="cand-header">
                <div>
                    <h1 className="cand-title">Browse Candidates</h1>
                    <p className="cand-subtitle">
                        Explore student profiles and discover talent.
                    </p>
                </div>

                <input
                    type="text"
                    className="cand-search"
                    placeholder="Search by name, skill, title..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                    }}
                />
            </div>

            {loading ? (
                <div className="cand-empty">
                    Loading candidates...
                </div>
            ) : displayedProfiles.length === 0 ? (
                <div className="cand-empty">
                    No candidates found.
                </div>
            ) : (
                <>
                    <div className="cand-grid">

                        {displayedProfiles.map((profile, index) => (
                            <div
                                key={profile.id}
                                className="cand-card"
                                style={{ animationDelay: `${index * 0.05}s` }}
                                onClick={() => navigate(`/candidate/${profile.id}`)}
                            >

                                <div className="cand-avatar">
                                    {getInitials(profile.name)}
                                </div>

                                {typeof profile.profileStrength === "number" && (
                                    <span className="cand-strength-badge" title="Profile completeness">
                                        {profile.profileStrength}%
                                    </span>
                                )}

                                <h3 className="cand-name">
                                    {profile.name || "Unnamed Candidate"}
                                </h3>

                                <p className="cand-job-title">
                                    {profile.jobTitle || "Student"}
                                </p>

                                {profile.company && (
                                    <p className="cand-company">
                                        {profile.company}
                                    </p>
                                )}

                                {profile.location && (
                                    <p className="cand-location">
                                        <svg
                                            className="cand-pin-icon"
                                            viewBox="0 0 24 24"
                                            width="13"
                                            height="13"
                                            fill="none"
                                            stroke="#111111"
                                            strokeWidth="1.6"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden="true"
                                        >
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        {profile.location}
                                    </p>
                                )}

                                {profile.about && (
                                    <p className="cand-about">
                                        {profile.about.length > 120
                                            ? `${profile.about.substring(0, 120)}...`
                                            : profile.about}
                                    </p>
                                )}

                                {profile.skills?.length > 0 && (
                                    <div className="cand-skills">
                                        {profile.skills.slice(0, 4).map((skill, index) => (
                                            <span
                                                key={index}
                                                className="cand-skill"
                                            >
                                                {skill}
                                            </span>
                                        ))}

                                        {profile.skills.length > 4 && (
                                            <span className="cand-skill-more">
                                                +{profile.skills.length - 4}
                                            </span>
                                        )}
                                    </div>
                                )}

                                <button
                                    className="cand-view-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/candidate/${profile.id}`);
                                    }}
                                >
                                    View Profile →
                                </button>

                            </div>
                        ))}

                    </div>

                    <div className="cand-pagination">

                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            Previous
                        </button>

                        <span>
                            Page {currentPage} of {totalPages}
                        </span>

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            Next
                        </button>

                    </div>

                </>
            )}

        </main>
    </div>


    );
}
