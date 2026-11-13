import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';




// SVG Icon components for use in the Navbar and Footer
const SignInIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-4 w-4 fill-current mr-2">
    <path d="M416 448h-84c-6.6 0-12-5.4-12-12v-40c0-6.6 5.4-12 12-12h84c22.1 0 40-17.9 40-40V124c0-22.1-17.9-40-40-40h-84c-6.6 0-12-5.4-12-12V44c0-6.6 5.4-12 12-12h84c48.6 0 88 39.4 88 88v256c0 48.6-39.4 88-88 88zm-88-233.9v-.2c0-3.9-1.9-7.7-5.2-10l-67.2-54.8c-7.2-5.9-18-5.6-24.8 .8-6.8 6.5-7.1 17.2-.6 24.8l47.5 59.9H84c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h195.4l-47.5 59.9c-6.5 7.6-6.2 18.3 .6 24.8 3.5 3.3 8.3 5 13.1 5 4.1 0 8.2-1.7 11.5-5l67.2-54.8c3.3-2.3 5.2-6.1 5.2-10.1v-.2z"/>
  </svg>
);

const RegisterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" className="h-4 w-4 fill-current mr-2">
    <path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm-45.7 64c-65.6 0-118.9 54-118.9 120.5 0 25.4 20.3 45.9 45.7 45.9h146.4c25.4 0 45.7-20.5 45.7-45.9 0-66.5-53.3-120.5-118.9-120.5zM480 320h64v128h-64v-128zm80 0h64v128h-64v-128zm-40-192c44.1 0 80 35.9 80 80s-35.9 80-80 80-80-35.9-80-80 35.9-80 80-80z"/>
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-4 w-4 fill-current mr-2">
    <path d="M495.2 254.9l-67.2 54.8c-3.3 2.3-5.2 6.1-5.2 10.1v.2c0 3.9 1.9 7.7 5.2 10l67.2 54.8c6.8 6.5 7.1 17.2 .6 24.8-6.5 7.6-17.2 7.9-24.8 .6L324 354.1V400c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12V354.1L180 439.9c-7.6 7.3-18.3 7-24.8 .6-6.5-7.6-6.2-18.3 .6-24.8l67.2-54.8c3.3-2.3 5.2-6.1 5.2-10.1v-.2c0-3.9-1.9-7.7-5.2-10l-67.2-54.8c-7.2-5.9-7.5-16.6-.9-23.2 6.5-6.5 17.2-6.8 24.8 .9l72.9 59.5V112c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v112.5l72.9-59.5c7.6-7.7 18.3-7.4 24.8 .9 6.5 6.5 6.8 17.2 .6 24.8z"/>
  </svg>
);

// Navbar component
const Navbar = () => {
  const navigate = useNavigate();
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleSignIn = () => {
    navigate("/signin");
  };

   useEffect(() => {
    const controlNavbar = () => {
      if (window.scrollY > lastScrollY) {
        // scrolling down → hide
        setShowNavbar(false);
      } else {
        // scrolling up → show
        setShowNavbar(true);
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener("scroll", controlNavbar);
    return () => {
      window.removeEventListener("scroll", controlNavbar);
    };
  }, [lastScrollY]);

  return (
    <nav
      className={`bg-white dark:bg-slate-900 shadow-md fixed w-full z-20 top-0 transition-transform duration-300 ${
        showNavbar ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="container mx-auto px-4 py-3 flex flex-wrap justify-between items-center">
        {/* Logo */}
        <a
          href="/"
          className="flex items-center text-slate-800 dark:text-slate-100 text-lg md:text-2xl font-bold hover:text-slate-700 dark:text-slate-200"
        >
          <img src="/blogtec.png" alt="BlogTec Logo" className="h-10 md:h-14 w-auto mr-6" />
        </a>

        {/* Links */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-2 md:mt-0">
          <a href="#home" className="text-slate-700 dark:text-slate-200 text-sm md:text-base font-medium hover:text-slate-600">
            Home
          </a>
          <a href="#features" className="text-slate-700 dark:text-slate-200 text-sm md:text-base font-medium hover:text-slate-600">
            Features
          </a>
          <a href="#contact" className="text-slate-700 dark:text-slate-200 text-sm md:text-base font-medium hover:text-slate-600">
            Contact
          </a>
          <button
            onClick={handleSignIn}
            className="btn-primary px-3 md:px-5 py-1.5 md:py-2 md:text-base text-slate-600 border-slate-200 dark:border-slate-700/60 border-slate-600 rounded-full hover:bg-slate-600 hover:text-white transition"
          >
            Sign In
          </button>
        </div>
      </div>
    </nav>
  );
};

// HomePage component
const HomePage = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-800/50 font-sans">
    <Navbar />

      {/* Hero Section */}
      <header className="bg-white dark:bg-slate-900 py-20">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 text-center md:text-left">
              <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                Streamline Your Business <br /> with <span className="text-slate-600">BlogTec Softwares</span>
              </h1>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                A powerful and intuitive platform to manage all your financial transactions and inventory with ease.
              </p>
              <div className="mt-8 flex justify-center md:justify-start space-x-4">
                <a
                 href="#"
                 className="px-8 py-4 text-lg font-bold text-white bg-slate-600 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-slate-500 focus:ring-opacity-50 transition-transform transform hover:scale-105"
                >
                  Get Started
                </a>
                {/* <button
                  href="#"
                  onClick={() => navigate("/signin")} className="px-8 py-4 text-lg font-bold text-slate-600 bg-transparent border-2 border-slate-600 rounded-full hover:bg-slate-600 hover:text-white focus:outline-none focus:ring-4 focus:ring-slate-500 focus:ring-opacity-50 transition-transform transform hover:scale-105"
                >
                  Sign In
                </button> */}
              </div>
            </div>
            <div className="md:w-1/2 mt-12 md:mt-0 flex justify-center">
              <img
                src="https://placehold.co/800x600/E5E7EB/1F2937?text=Dashboard+Mockup"
                alt="Dashboard Mockup"
                className="rounded-3xl shadow-2xl w-full max-w-lg"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50 dark:bg-slate-800/50">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">Key Features</h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
              Our platform offers a suite of tools designed to boost your efficiency and accuracy.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-slate-500 mb-4">
                <span className="text-4xl">⚡</span>
              </div>
              <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Fast Transactions</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Record cash transactions, item details, and sales quickly and without errors.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-slate-500 mb-4">
                <span className="text-4xl">👥</span>
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-slate-800 dark:text-slate-100">User Management</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Manage user roles and permissions with a powerful and easy-to-use interface.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-slate-500 mb-4">
                <span className="text-4xl">💰</span>
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-slate-800 dark:text-slate-100">Financial Reporting</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Generate comprehensive reports to track your business's financial performance.
              </p>
            </div>
            {/* Feature 4 */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-slate-500 mb-4">
                <span className="text-4xl">📈</span>
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-slate-800 dark:text-slate-100">Dashboard Analytics</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Get a clear overview of your operations with a real-time dashboard.
              </p>
            </div>
            {/* Feature 5 */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-slate-500 mb-4">
                <span className="text-4xl">📦</span>
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-slate-800 dark:text-slate-100">Inventory Management</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Keep track of your precious metals and items with a centralized system.
              </p>
            </div>
            {/* Feature 6 */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-slate-500 mb-4">
                <span className="text-4xl">🔒</span>
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-slate-800 dark:text-slate-100">Secure & Reliable</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Your data is safe with us. We ensure top-notch security and reliability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-slate-600 text-white py-20">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <h2 className="text-4xl font-extrabold">Ready to Get Started?</h2>
          <p className="mt-4 text-lg">
            Join thousands of satisfied users and take control of your business today.
          </p>
          <a
            href="#"
            className="mt-8 px-8 py-4 text-lg font-bold bg-white dark:bg-slate-900 text-slate-600 rounded-full hover:bg-slate-100 dark:bg-slate-800 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50"
          >
            Sign Up Now
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-800 text-white py-12">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* About */}
            <div>
              <h3 className="text-xl font-bold">BlogTec Software LLP</h3>
              <p className="mt-4 text-slate-400 dark:text-slate-500">
                BlogTec Software provides scalable ERP solutions that integrate finance, sales, inventory, and HR to streamline operations and boost business efficiency.
              </p>
            </div>
            {/* Links */}
            <div>
              <h3 className="text-xl font-bold">Quick Links</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className="text-slate-400 dark:text-slate-500 hover:text-white transition-colors duration-200">Home</a></li>
                <li><a href="#features" className="text-slate-400 dark:text-slate-500 hover:text-white transition-colors duration-200">Features</a></li>
                <li><a href="#contact" className="text-slate-400 dark:text-slate-500 hover:text-white transition-colors duration-200">Contact</a></li>
              </ul>
            </div>
            {/* Contact */}
            <div>
              <h3 className="text-xl font-bold">Contact Us</h3>
              <ul className="mt-4 space-y-2 text-slate-400 dark:text-slate-500">
                {/* Updated Phone Icon */}
                   <li className="flex items-center">
                    <svg className="w-5 h-5 fill-current mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.42 16.29l-3.22-3.22c-.6-.6-1.5-.6-2.1 0l-1.6 1.6c-.4.4-.5 1.2-.1 1.6 1.6 1.6 3.2 3.2 4.8 4.8.4.4 1.2.3 1.6-.1l1.6-1.6c.6-.6.6-1.5 0-2.1zM18.73 13.56l-1.6 1.6c-.4.4-.5 1.2-.1 1.6s.4.4 1.6-1.6c.6-.6.6-1.5 0-2.1z"/>
                    </svg>
                    +91 9995120097
                </li>
                {/* Updated Address Icon */}
                <li className="flex items-center">
                    <svg className="w-5 h-5 fill-current mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2c-4.418 0-8 3.582-8 8 0 4.418 8 14 8 14s8-9.582 8-14c0-4.418-3.582-8-8-8zm0 11.5c-1.933 0-3.5-1.567-3.5-3.5s1.567-3.5 3.5-3.5 3.5 1.567 3.5 3.5-1.567 3.5-3.5 3.5z"/>
                    </svg>
                    62/3708, Iyyattil Jn., Kochi, Kerala,682011
                </li>

                {/* Updated Email Icon */}
               <li className="flex items-center">
                    <svg className="w-5 h-5 fill-current mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 4H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-9 5-9-5V6l9 5 9-5v2z"/>
                    </svg>
                    blogtecsoftware@gmail.com
                </li>

              </ul>
            </div>
            {/* Social */}
            <div>
              <h3 className="text-xl font-bold">Follow Us</h3>
              <div className="mt-4 flex space-x-4">
                {/* Updated Facebook Icon */}
                <a href="#" className="text-slate-400 dark:text-slate-500 hover:text-white transition-colors duration-300">
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 0h-4c-2.761 0-5 2.239-5 5v3h-3v4h3v12h5v-12h3l1-4h-4v-3c0-1.039.812-1.921 2-2h2v-2z"/>
                    </svg>
                </a>
                {/* Updated Twitter Icon */}
                <a href="#" className="text-slate-400 dark:text-slate-500 hover:text-white transition-colors duration-300">
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18.901 1.93h3.308l-7.227 8.261L22.463 22H15.77l-5.836-7.734-6.666 7.734H0L7.536 8.625 1.458 2.25h6.05L12 8.291l4.542-6.041h-6.05zm-.807 15.655l-9.143-12.784H2.094l6.236 8.718L18.437 20h2.1l-6.236-8.718-1.018-1.428-1.018 1.428z"/>
                    </svg>
                </a>
                {/* Updated LinkedIn Icon */}
                <a href="#" className="text-slate-400 dark:text-slate-500 hover:text-white transition-colors duration-300">
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-3 16.5v-9h2.15l-.014 2.15h.02c.4-.658 1.334-1.09 2.22-1.09 1.77 0 2.994 1.157 2.994 3.44v4.5h-2.16v-3.71c0-1.458-.87-1.748-1.57-1.748-.718 0-1.353.116-1.353 1.15v4.308h-2.15z"/>
                    </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-10 text-center text-slate-500 dark:text-slate-400 border-t border-slate-700 dark:border-slate-700/60 pt-8">
            &copy; 2025 BlogTec Software LLP. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
);

export default HomePage;


