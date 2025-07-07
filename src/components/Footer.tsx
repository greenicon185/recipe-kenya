
import React from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, Instagram, MessageCircle, Github, Facebook } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center space-x-2 text-orange-500 mb-4">
              <ChefHat className="h-8 w-8" />
              <span className="text-2xl font-bold">Recipe Haven</span>
            </Link>
            <p className="text-gray-300 mb-6 max-w-md">
              Discover amazing recipes from around the world. From traditional Kenyan dishes to international cuisines, 
              find your next favorite meal with our curated collection.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              <a 
                href="https://www.instagram.com/macloyd_meli_k/?utm_source=ig_web_button_share_sheet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-500 transition-colors duration-200"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="h-6 w-6" />
              </a>
              <a 
                href="https://wa.me/254799754302"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-500 transition-colors duration-200"
                aria-label="Contact us on WhatsApp"
              >
                <MessageCircle className="h-6 w-6" />
              </a>
              <a 
                href="https://github.com/Macloyd"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-purple-500 transition-colors duration-200"
                aria-label="View our GitHub"
              >
                <Github className="h-6 w-6" />
              </a>
              <a 
                href="https://www.facebook.com/macloyd.melly"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-500 transition-colors duration-200"
                aria-label="Follow us on Facebook"
              >
                <Facebook className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-orange-500">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/cuisines" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Cuisines
                </Link>
              </li>
              <li>
                <Link to="/category/all" className="text-gray-300 hover:text-white transition-colors duration-200">
                  All Recipes
                </Link>
              </li>
              <li>
                <Link to="/favorites" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Favorites
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-orange-500">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/category/breakfast" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Breakfast
                </Link>
              </li>
              <li>
                <Link to="/category/lunch" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Lunch
                </Link>
              </li>
              <li>
                <Link to="/category/dinner" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Dinner
                </Link>
              </li>
              <li>
                <Link to="/category/dessert" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Desserts
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Recipe Haven. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
              Terms of Service
            </a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-200">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
