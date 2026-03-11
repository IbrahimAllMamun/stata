// src/pages/admin/aspl/AsplSlideshow.tsx
import '../../aspl/aspl.css';
import Slideshow from '../../../components/aspl/Slideshow';

// Renders the full-screen slideshow - no Layout wrapper needed.
// Accessed via /admin/aspl/slideshow (protected, admin+mod only)
export default function AsplSlideshow() {
  return <Slideshow />;
}
