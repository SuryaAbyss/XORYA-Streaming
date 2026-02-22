import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MovieDetails from './pages/MovieDetails';
import VideoPlayer from './pages/VideoPlayer';
import { MovieModalProvider } from './context/MovieModalContext';
import MovieDetailsModal from './components/MovieDetailsModal';
import GridBackground from './components/GridBackground';
import IntroAnimation from './components/IntroAnimation';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <MovieModalProvider>
        <GridBackground>
          <div className="app">
            <IntroAnimation />
            <Navbar />
            <Routes>
              <Route path="/" element={<Home category="all" />} />
              <Route path="/movies" element={<Home category="movies" />} />
              <Route path="/series" element={<Home category="tv" />} />
              <Route path="/movie/:id" element={<MovieDetails />} />
              <Route path="/watch/:type/:id" element={<VideoPlayer />} />
              <Route path="/watch/:type/:id/season/:season/episode/:episode" element={<VideoPlayer />} />
            </Routes>
            <MovieDetailsModal />
            <Footer />
          </div>
        </GridBackground>
      </MovieModalProvider>
    </Router>
  );
}

export default App;
