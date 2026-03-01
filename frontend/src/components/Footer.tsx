import { Facebook, Twitter, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#1F2A44] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-[#2F5BEA] rounded-full flex items-center justify-center">
                <span className="text-xl font-bold">S</span>
              </div>
              <span className="text-xl font-bold">STATA</span>
            </div>
            <p className="text-gray-300 text-sm">
              Connecting Minds, Building Bonds, Nourishing Well-being.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-300 hover:text-[#F39C12] transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-gray-300 hover:text-[#F39C12] transition-colors text-sm">
                  Events
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="text-gray-300 hover:text-[#F39C12] transition-colors text-sm">
                  Gallery
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-[#F39C12] transition-colors text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-gray-300 text-sm">
                <MapPin className="w-4 h-4" />
                <span>ISRT, University of Dhaka</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-300 text-sm">
                <Mail className="w-4 h-4" />
                <span>stata@isrt.ac.bd</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-300 text-sm">
                <Phone className="w-4 h-4" />
                <span>+880 123 456 789</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-[#2F5BEA] rounded-full flex items-center justify-center hover:bg-[#F39C12] transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-[#2F5BEA] rounded-full flex items-center justify-center hover:bg-[#F39C12] transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-[#2F5BEA] rounded-full flex items-center justify-center hover:bg-[#F39C12] transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700 text-center">
          <p className="text-gray-300 text-sm">
            &copy; {new Date().getFullYear()} STATA - ISRT, University of Dhaka. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
