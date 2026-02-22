import React, { createContext, useContext, useState } from 'react';

const MovieModalContext = createContext();

export const useMovieModal = () => {
    const context = useContext(MovieModalContext);
    if (!context) {
        throw new Error('useMovieModal must be used within MovieModalProvider');
    }
    return context;
};

export const MovieModalProvider = ({ children }) => {
    const [selectedMovieId, setSelectedMovieId] = useState(null);
    const [selectedMediaType, setSelectedMediaType] = useState('movie');

    const openModal = (movieId, mediaType = 'movie') => {
        setSelectedMovieId(movieId);
        setSelectedMediaType(mediaType);
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        setSelectedMovieId(null);
        // Restore body scroll when modal closes
        document.body.style.overflow = 'unset';
    };

    return (
        <MovieModalContext.Provider value={{ selectedMovieId, selectedMediaType, openModal, closeModal }}>
            {children}
        </MovieModalContext.Provider>
    );
};
