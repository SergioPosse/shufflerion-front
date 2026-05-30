import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Callback from './pages/Callback'
import Waiting from './pages/Waiting'
import Player from './pages/Player'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/callback" element={<Callback />} />
      <Route path="/waiting/:sessionId" element={<Waiting />} />
      <Route path="/player/:sessionId" element={<Player />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
