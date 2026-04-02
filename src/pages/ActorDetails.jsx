import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Film, Star, User, Award, Play } from 'lucide-react';
import { getPersonDetails, getPersonCombinedCredits, imageUrl } from '../api/tmdb';
import InteractiveMovieCard from '../components/InteractiveMovieCard';

const ActorDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [person, setPerson] = useState(null);
    const [credits, setCredits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActorData = async () => {
            setLoading(true);
            try {
                const [detailsRes, creditsRes] = await Promise.all([
                    getPersonDetails(id),
                    getPersonCombinedCredits(id)
                ]);
                setPerson(detailsRes.data);
                
                // Filter out entries without poster and sort by popularity or release date
                const sortedCredits = (creditsRes.data.cast || [])
                    .filter(c => c.poster_path)
                    .sort((a, b) => b.popularity - a.popularity);
                
                setCredits(sortedCredits);
            } catch (error) {
                console.error("Error fetching actor details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchActorData();
    }, [id]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
                <div style={{ width: '60px', height: '60px', border: '4px solid rgba(230, 25, 25, 0.3)', borderTop: '4px solid #E61919', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!person) return <div style={{ color: 'white', textAlign: 'center', padding: '5rem' }}>Actor not found.</div>;

    const profileSrc = person.profile_path ? imageUrl(person.profile_path, 'h632') : null;
    const topMovie = credits[0]; // The top ranked movie/show

    // Design Tokens matching the first graphic poster
    const colors = {
        bgDeep: '#0f172a',       // Site background
        bentoOutline: '#D4E6EB', // Outer frame background (Ice Blue)
        redAccent: '#DC2626',    // Strong graphic red
        darkBlue: '#0F172A',     // Graphic dark blue
        white: '#FFFFFF',
        textDark: '#1E293B',
        textLight: '#F8FAFC'
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: colors.bgDeep, 
            paddingTop: '80px', 
            paddingBottom: '5rem',
            overflowX: 'hidden',
        }}>
            {/* Header / Back Action */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem 2rem' }}>
                <button 
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.8rem',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '1rem',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        padding: '10px 0',
                    }}
                >
                    <ArrowLeft size={20} /> Back to browsing
                </button>
            </div>

            {/* Poster Bento Graphic Canvas */}
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1rem' }}>
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{
                        background: colors.bentoOutline,
                        borderRadius: '30px',
                        padding: '16px',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                        marginBottom: '3rem',
                        // CSS Grid defining the graphic blocks
                        display: 'grid',
                        gridTemplateAreas: `
                            "A B B D"
                            "A C C E"
                            "A F F E"
                        `,
                        gridTemplateColumns: 'minmax(200px, 240px) 1fr 1fr minmax(180px, 220px)',
                        gap: '16px'
                    }}
                    className="actor-bento-grid"
                >
                    <style>
                        {`
                        @media (max-width: 1100px) {
                            .actor-bento-grid {
                                grid-template-areas: 
                                    "B B"
                                    "A D"
                                    "A E"
                                    "C C"
                                    "F F" !important;
                                grid-template-columns: 1fr 1fr !important;
                            }
                        }
                        @media (max-width: 768px) {
                            .actor-bento-grid {
                                display: flex !important;
                                flexDirection: column !important;
                            }
                        }
                        `}
                    </style>

                    {/* AREA A: Outer Profile Card (White + Red) */}
                    <div style={{ 
                        gridArea: 'A', 
                        background: colors.white, 
                        borderRadius: '24px', 
                        padding: '20px', 
                        display: 'flex', 
                        flexDirection: 'column',
                    }}>
                        <div style={{ 
                            fontFamily: "'Impact', 'Arial Black', sans-serif", 
                            color: colors.redAccent, 
                            fontSize: '3rem', 
                            transform: 'rotate(-4deg)', 
                            lineHeight: 0.8, 
                            marginBottom: '15px',
                            textShadow: '2px 2px 0px rgba(0,0,0,0.1)'
                        }}>
                            PROFILE
                        </div>
                        <div style={{ fontWeight: '800', color: colors.textDark, marginBottom: '15px', fontSize: '1rem', lineHeight: 1.3 }}>
                            Details for<br/>
                            <span style={{ opacity: 0.6 }}>@{person.name.replace(/\s+/g, '').toLowerCase()}</span>
                        </div>
                        
                        <div style={{ 
                            background: colors.redAccent, 
                            borderRadius: '16px', 
                            padding: '8px', 
                            width: '100%',
                            aspectRatio: '2/3',
                            display: 'flex', 
                            justifyContent: 'center', 
                            overflow: 'hidden',
                            boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.2)'
                        }}>
                            {profileSrc ? (
                                <img src={profileSrc} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                            ) : (
                                <User size={80} color="white" />
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '15px', color: colors.textDark, fontWeight: '800', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', textAlign: 'center' }}>
                                <Film size={18} />
                                <span>{credits.length}</span>
                                <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>Roles</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', textAlign: 'center' }}>
                                <Star size={18} />
                                <span>{(person.popularity || 0).toFixed(0)}</span>
                                <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>Rating</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', textAlign: 'center' }}>
                                <Award size={18} />
                                <span>{person.known_for_department}</span>
                                <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>Dep</span>
                            </div>
                        </div>
                    </div>

                    {/* AREA B: Giant Name Typography Card (Dark Blue) */}
                    <div style={{ 
                        gridArea: 'B', 
                        background: colors.darkBlue, 
                        borderRadius: '24px', 
                        position: 'relative', 
                        overflow: 'hidden', 
                        minHeight: '160px',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        {/* Abstract Background element (representing the red/blue graphic shapes) */}
                        <div style={{ position: 'absolute', top: '-100px', right: '-50px', width: '300px', height: '300px', background: colors.redAccent, borderRadius: '50%', opacity: 0.8 }} />
                        <div style={{ position: 'absolute', bottom: '-50px', left: '20%', width: '200px', height: '200px', background: '#2563EB', borderRadius: '50%', opacity: 0.8 }} />
                        <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(40px)', background: 'rgba(15, 23, 42, 0.4)' }} />
                        
                        <div style={{ position: 'relative', padding: '20px 24px', zIndex: 10 }}>
                            <div style={{ color: 'white', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem', fontWeight: '800', opacity: 0.8, marginBottom: '5px' }}>
                                Featured Star
                            </div>
                            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: 'white', fontWeight: '900', margin: 0, lineHeight: 0.9, textTransform: 'uppercase', letterSpacing: '-1px' }}>
                                {person.name}
                            </h1>
                        </div>
                    </div>

                    {/* AREA C: Biography Card (White) */}
                    <div style={{ 
                        gridArea: 'C', 
                        background: colors.white, 
                        borderRadius: '24px', 
                        padding: '24px', 
                        color: colors.textDark,
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '10px', textTransform: 'uppercase', color: colors.redAccent, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Award size={16} /> Biography
                        </h3>
                        <div style={{ overflowY: 'auto', flex: 1, maxHeight: '180px', paddingRight: '10px', fontSize: '0.9rem', lineHeight: 1.6, fontWeight: 500, scrollbarWidth: 'thin', scrollbarColor: `${colors.redAccent} transparent` }}>
                            {person.biography ? person.biography : "No biography available for this person."}
                        </div>
                    </div>

                    {/* AREA D: Top Right Profile Pill (White) */}
                    <div style={{ 
                        gridArea: 'D', 
                        background: colors.white, 
                        borderRadius: '24px', 
                        padding: '16px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: colors.redAccent, overflow: 'hidden', flexShrink: 0 }}>
                            {profileSrc && <img src={profileSrc} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <div>
                            <div style={{ fontSize: '0.65rem', fontWeight: '800', color: colors.redAccent, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Birth
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 900, color: colors.textDark, lineHeight: 1.2 }}>
                                {person.birthday ? new Date(person.birthday).toLocaleDateString() : 'Unknown'}
                            </div>
                        </div>
                    </div>

                    {/* AREA E: Best Known For / Poster (Red) */}
                    <div style={{ 
                        gridArea: 'E', 
                        background: colors.redAccent, 
                        borderRadius: '24px', 
                        padding: '16px', 
                        color: 'white', 
                        display: 'flex', 
                        flexDirection: 'column',
                    }}>
                        <div style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '10px', textAlign: 'center' }}>
                            Known For
                        </div>
                        <div style={{ flex: 1, minHeight: '180px', borderRadius: '16px', overflow: 'hidden', background: '#000', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                            {topMovie && topMovie.poster_path ? (
                                <img src={imageUrl(topMovie.poster_path, 'w500')} alt="Movie poster" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Film size={30} opacity={0.3}/></div>
                            )}
                        </div>
                        <div style={{ 
                            marginTop: '15px', 
                            fontFamily: "'Impact', 'Arial Black', sans-serif", 
                            fontSize: '1.5rem', 
                            transform: 'rotate(-3deg)', 
                            textAlign: 'center',
                            lineHeight: 1
                        }}>
                            {topMovie?.title || topMovie?.name || 'Various'}
                        </div>
                    </div>

                    {/* AREA F: Project Gallery Call to action (Red) */}
                    <motion.div 
                        onClick={() => document.getElementById('project-gallery')?.scrollIntoView({ behavior: 'smooth' })}
                        whileHover={{ scale: 1.02, backgroundColor: '#ea3e3e' }}
                        whileTap={{ scale: 0.98 }}
                        style={{ 
                            gridArea: 'F', 
                            background: colors.redAccent, 
                            borderRadius: '24px', 
                            padding: '16px 24px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            color: 'white',
                            cursor: 'pointer'
                        }}>
                        <div>
                            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>Project Gallery</h2>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9 }}>
                                Discover {credits.length} projects
                            </div>
                        </div>
                        <div style={{ background: 'white', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                            <Play size={22} fill={colors.redAccent} color={colors.redAccent} style={{ marginLeft: '4px' }} />
                        </div>
                    </motion.div>
                </motion.div>

                {/* Sub-Header for Grid Container */}
                <h2 id="project-gallery" style={{ fontSize: '1.8rem', color: 'white', fontWeight: '800', marginBottom: '2rem', paddingLeft: '1rem', borderLeft: `5px solid ${colors.redAccent}` }}>
                    All Projects ({credits.length})
                </h2>

                {/* Credits Grid Area */}
                <div className="movies-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '2rem',
                }}>
                    {credits.map((item, index) => (
                        <motion.div
                            key={`${item.id}-${index}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            style={{ position: 'relative' }}
                            onClick={() => navigate(`/watch/${item.media_type || 'movie'}/${item.id}`)}
                        >
                            <InteractiveMovieCard 
                                movie={{
                                    ...item, 
                                    title: item.title || item.name,
                                    release_date: item.release_date || item.first_air_date
                                }} 
                                index={index}
                            />
                            {item.character && (
                                <div style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    background: colors.redAccent,
                                    color: 'white',
                                    padding: '6px 12px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: '900',
                                    zIndex: 10,
                                    maxWidth: '80%',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                                    textTransform: 'uppercase'
                                }}>
                                    {item.character}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ActorDetails;
