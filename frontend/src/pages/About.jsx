import React from 'react';
import { FiGithub, FiMail } from 'react-icons/fi';

const TeamMemberCard = ({ name, image, github, email, linkedin }) => (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1 border border-gray-100 group">
        <div className="p-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary-50 group-hover:border-primary-100 transition-colors">
                    <img
                        src={image}
                        alt={name}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/5 transition-colors" />
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-1">{name}</h3>

            <div className="flex items-center justify-center space-x-3 mt-2 h-8">
                {github && (
                    <a href={github} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors">
                        <FiGithub className="w-5 h-5" />
                    </a>
                )}
                {email && (
                    <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                        <FiMail className="w-5 h-5" />
                    </a>
                )}
            </div>

            <a href={linkedin || "#"} target="_blank" rel="noopener noreferrer" className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
                View profile
            </a>
        </div>
    </div>
);

const About = () => {
    const teamMembers = [
        {
            id: 1,
            name: "Pratik Tawhare",
            image: "/images/Pratik.jpeg",
            github: "https://github.com/pratiktawhare",
            email: "pratiktawhare3@gmail.com",
            linkedin: "https://www.linkedin.com/in/pratik-tawhare"
        },
        {
            id: 2,
            name: "Aary Thasal",
            image: "/images/Aary.jpeg",
            github: "https://github.com/AaryThasal",
            email: "aarythasal1@gmail.com",
            linkedin: "https://www.linkedin.com/in/aary-thasal-9255392a7"
        },
        {
            id: 3,
            name: "Komal Mhaske",
            image: "/images/komal.jpeg",
            github: "https://github.com/Komal251005",
            email: "komalmhaske.253@gmail.com",
            linkedin: "https://www.linkedin.com/in/komal-mhaske-8b554331a/"
        },
        {
            id: 4,
            name: "Tanishka Patil",
            image: "/images/tanishka.jpeg",
            github: "https://github.com/PatilTanishkaa",
            email: "tanishkapatil26oct@gmail.com",
            linkedin: "https://www.linkedin.com/in/tanishkapatillnkdin/"
        },
        {
            id: 5,
            name: "Abhishek Tamte",
            image: "/images/Tamte.jpeg",
            github: "https://github.com/abhishek200604",
            email: "abhishektamte20@gmail.com",
            linkedin: "https://www.linkedin.com/in/abhishek-tamte-09b81421a/"
        },
        {
            id: 6,
            name: "Akash Patil",
            image: "/images/Akash.jpeg",
            github: "https://github.com/Akashpatil2005",
            email: "apatil99448@gmail.com",
            linkedin: "https://www.linkedin.com/in/akash-patil-b08335290/"
        },
        {
            id: 7,
            name: "Arbaj Sande",
            image: "/images/arbaj.jpeg",
            github: "https://github.com/ArbajSande",
            email: "arbajsande786@gmail.com",
            linkedin: "https://www.linkedin.com/in/arbaj-sande-47bb1a31b"
        },
        {
            id: 8,
            name: "Abhijeet Suryawanshi",
            image: "/images/abhijeet.jpeg",
            github: "https://github.com/Abhijeet-dev07",
            email: "abhijeetsuryawanshi23@gmail.com",
            linkedin: "https://www.linkedin.com/in/abhijeet-suryawanshi-21a587294"
        }

    ];

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Header Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">About the Team</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    We are a group of passionate students from Zeal College of Engineering,
                    dedicated to building efficient solutions for academic management.
                </p>
            </div>

            {/* Team Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {teamMembers.map((member) => (
                    <TeamMemberCard key={member.id} {...member} />
                ))}
            </div>

            {/* Project Info Section */}
            <div className="bg-gradient-to-r from-primary-700 to-primary-800 rounded-2xl shadow-lg p-8 text-white text-center mt-12">
                <h2 className="text-2xl font-bold mb-4">Fine Management System</h2>
                <p className="text-white/90 max-w-3xl mx-auto leading-relaxed">
                    This project is designed to streamline the process of managing student fines and records.
                    Built with modern web technologies including React, NodeJS, and TailwindCSS to ensure
                    a seamless and responsive user experience.
                </p>
            </div>
        </div>
    );
};

export default About;
