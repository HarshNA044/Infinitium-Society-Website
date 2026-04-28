import express from 'express';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// In-memory "database" (Synced with root server.ts)
let events = [
    {
      id: '1',
      title: 'Exploromania: Motivational Seminar',
      subtitle: 'Pathways to Personal & Professional Excellence',
      description: 'A seminar by Dr. Lajjaram Bishnoi (DGP of Meghalaya) on mental health and cracking civil services.',
      date: '2024-02-10',
      type: 'Seminar',
      status: 'Past',
      location: 'Main Auditorium',
      image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80',
      stats: { registrations: 450, attendance: 420 }
    },
    {
      id: '2',
      title: 'Beyond the Veil: Supernatural Science',
      subtitle: 'Unmasking the Mysteries of the Paranormal',
      description: 'Exploring the science behind supernatural beliefs with Mr. Waqar Raj (Indian Paranormal Society).',
      date: '2024-03-15',
      type: 'Seminar',
      status: 'Past',
      location: 'Seminar Hall 1',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80',
      stats: { registrations: 380, attendance: 350 }
    },
    {
      id: '3',
      title: 'Socio-Sync: Science Museum Visit',
      subtitle: 'A Journey Through Scientific Evolution',
      description: 'Exploring the intertwined nature of Physics, Chemistry, Biology and Technology at National Science Museum.',
      date: '2024-04-20',
      type: 'Field Trip',
      status: 'Past',
      location: 'National Science Museum',
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
      stats: { registrations: 120, attendance: 115 }
    },
    {
      id: '4',
      title: 'Quantum Leap: Physics Tech Expo',
      subtitle: 'Celebrating the Wonders of Modern Physics',
      description: 'The annual flagship event of Infinitium featuring guest lectures, project exhibitions, and tech challenges.',
      date: '2026-05-30',
      type: 'Fest',
      status: 'Upcoming',
      location: 'College Playground',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
      stats: { registrations: 85, attendance: 0 }
    }
];

let registrations = [
    { eventId: '1', eventTitle: 'Exploromania: Motivational Seminar', studentName: 'Rahul Kumar', rollNo: '22/PH/001', email: 'rahul.k@arsd.du.ac.in', ticketId: 'INF-RAHUL01', attended: true, timestamp: new Date('2024-02-09T10:00:00Z') },
    { eventId: '1', eventTitle: 'Exploromania: Motivational Seminar', studentName: 'Priya Singh', rollNo: '22/PH/015', email: 'priya.s@arsd.du.ac.in', ticketId: 'INF-PRIYA15', attended: true, timestamp: new Date('2024-02-09T10:05:00Z') },
    { eventId: '2', eventTitle: 'Beyond the Veil: Supernatural Science', studentName: 'Amit Sharma', rollNo: '23/PH/042', email: 'amit.sh@arsd.du.ac.in', ticketId: 'INF-AMIT42', attended: false, timestamp: new Date('2024-03-14T14:20:00Z') },
    { eventId: '4', eventTitle: 'Quantum Leap: Physics Tech Expo', studentName: 'Sneha Verma', rollNo: '24/PH/102', email: 'sneha.v@arsd.du.ac.in', ticketId: 'INF-SNEHA02', attended: false, timestamp: new Date() }
];
let feedback = [];
let members = [
    { id: '1', name: 'Saksham Raj', role: 'President', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', linkedin: '#', tenure: '2024-25' },
    { id: '2', name: 'Ritik', role: 'Vice-President', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop', linkedin: '#', tenure: '2024-25' },
    { id: '3', name: 'Vaishanvi Shukla', role: 'Vice-President', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop', linkedin: '#', tenure: '2024-25' },
    { id: '4', name: 'Sarthak Jiswal', role: 'Secretary', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop', linkedin: '#', tenure: '2024-25' },
    { id: '5', name: 'Ayush Kumar Garg', role: 'Joint Secretary', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop', linkedin: '#', tenure: '2024-25' },
    { id: '6', name: 'Mritunjay Yadav', role: 'Academic Head', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop', linkedin: '#', tenure: '2024-25' },
    { id: '7', name: 'Divyansh Pratap Singh', role: 'Content Head', image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop', linkedin: '#', tenure: '2024-25' },
    { id: '8', name: 'Pragya Saxena', role: 'Content Sub-head', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop', linkedin: '#', tenure: '2024-25' },
    { id: '9', name: 'Atul Singh', role: 'Digital Head', image: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop', linkedin: '#', tenure: '2024-25' },
    { id: '10', name: 'Nishant', role: 'Digital Sub-head', image: 'https://images.unsplash.com/photo-1493106819501-66d381c466f1?w=400&h=400&fit=crop', linkedin: '#', tenure: '2024-25' },
    { id: '11', name: 'Niranjan Tripathi', role: 'Event Head', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop', linkedin: '#', tenure: '2024-25' },
    { id: '12', name: 'Raunak Kumar', role: 'Event Sub-head', image: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&h=400&fit=crop', linkedin: '#', tenure: '2024-25' },
    { id: '13', name: 'Vikas Yadav', role: 'PR Head', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', linkedin: '#', tenure: '2024-25' },
    { id: '14', name: 'Keshav Agrawal', role: 'PR Sub-head', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop', linkedin: '#', tenure: '2024-25' },
    { id: '15', name: 'Shrishti Singh', role: 'Sponsorship Head', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop', linkedin: '#', tenure: '2024-25' },
    // Past Members
    { id: '16', name: 'Former Pres', role: 'President', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', linkedin: '#', tenure: '2023-24' },
    { id: '17', name: 'Former VP', role: 'Vice-President', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop', linkedin: '#', tenure: '2023-24' },
];

let achievements = [
    { id: '1', title: 'Best Society Award 2025', date: '2025-12-10', description: 'Recognized as the best technical society in University of Delhi.' },
    { id: '2', title: 'Inter-College Hackathon Winners', date: '2026-02-15', description: 'Our team won the Inter-College Hackathon at DTU, competing against 50+ colleges.' },
    { id: '3', title: 'Research Grant', date: '2026-01-20', description: 'Received a grant for our project on Sustainable Computing from the Ministry of IT.' },
    { id: '4', title: 'Community Outreach', date: '2025-11-05', description: 'Successfully trained 200+ school students in basic web development.' }
];

let aboutData = {
  hero: {
    title: "IGNITING CURIOSITY & FOSTERING EXCELLENCE",
    subtitle: "INFINITIUM, the society of Atma Ram Sanatan Dharma College, is a dynamic platform for students pursuing physical sciences to explore, discover, and delve into the fascinating world of Science.",
    image: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=1000"
  },
  objectives: [
    { id: '1', title: 'Promote Scientific Enquiry', text: 'Inspire students to think beyond the curriculum, encouraging them to ask questions and seek answers.' },
    { id: '2', title: 'Foster Collaboration', text: 'Providing a conducive environment for students to work together and learn from each other\'s strengths.' },
    { id: '3', title: 'Develop Research Skills', text: 'Support students in conducting experiments, collecting data, and preparing for future endeavors.' },
    { id: '4', title: 'Enhance Communication', text: 'Enabling members to articulate complex scientific concepts effectively through seminars and discussions.' }
  ],
  impacts: [
    { id: '1', title: 'Scientific Literacy', text: 'Enhances understanding of scientific principles and their applications in real-world scenarios.' },
    { id: '2', title: 'Leadership & Collaboration', text: 'Prepares students for leadership roles in communities, industries, and various work fields.' },
    { id: '3', title: 'Builds Confidence', text: 'Empowers members to express their ideas, present research, and engage confidently in discussions.' },
    { id: '4', title: 'Skill Development', text: 'Improves public speaking, event organization, and teamwork skills for career and personal growth.' }
  ],
  departments: [
    { id: '1', title: 'Academic', aim: 'Support students in their academic journey.', tasks: ["Provide essential resources (notes, PYQs)", "Foster academic success", "Stay informed about college happenings"] },
    { id: '2', title: 'Content', aim: 'Provide high-quality engaging content.', tasks: ["Craft captions for social media", "Create regular event reports", "Utilize original creativity in writing"] },
    { id: '3', title: 'Digital', aim: 'Bring creative ideas to online presence.', tasks: ["Prepare posters and graphics", "Edit reels and audio content", "Monitor online engagement metrics"] },
    { id: '4', title: 'Event', aim: 'Plan, organize, and execute events.', tasks: ["Coordinate with speakers and performers", "Manage logistics and venue", "Deliver successful society objectives"] },
    { id: '5', title: 'PR', aim: 'Craft and share compelling stories.', tasks: ["Develop communication strategies", "Maintain strong reputation", "Amplify society's voice and impact"] },
    { id: '6', title: 'Sponsorship', aim: 'Secure sponsorships and partnerships.', tasks: ["Build relationships with partners", "Negotiate and finalize deals", "Track revenue and ROI"] }
  ]
};

let galleryItems = [
  { id: '1', src: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80', title: 'Science Workshop', description: 'Hands-on training session on experimental physics.', category: 'Academic' },
  { id: '2', src: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=80', title: 'Exploromania Seminar', description: 'Motivational talk by industry experts.', category: 'Events' },
  { id: '3', src: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&q=80', title: 'Beyond the Veil', description: 'Exploring the science of the unknown.', category: 'Events' },
  { id: '4', src: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&q=80', title: 'Socio-Sync Meetup', description: 'Networking event for science enthusiasts.', category: 'Social' },
  { id: '5', src: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&q=80', title: 'Team Collaboration', description: 'Core team planning session for the annual fest.', category: 'Academic' },
  { id: '6', src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80', title: 'Science Museum Visit', description: 'Educational tour of the National Science Centre.', category: 'Field Trip' },
];

let contactData = {
  location: "Atma Ram Sanatan Dharma College, Dhuala Kuan, New Delhi, Delhi 110021",
  email: "infinitium@arsd.du.ac.in",
  phone: "+91 99999 88888",
  mapLink: "https://maps.app.goo.gl/..."
};

// API Routes
app.get('/api/events', (req, res) => res.json(events));

app.post('/api/events', (req, res) => {
  const newEvent = { ...req.body, id: Date.now().toString(), stats: { registrations: 0, attendance: 0 } };
  events.unshift(newEvent);
  res.json(newEvent);
});

app.put('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const index = events.findIndex(e => e.id === id);
  if (index !== -1) {
    events[index] = { ...events[index], ...req.body };
    res.json(events[index]);
  } else {
    res.status(404).json({ error: 'Event not found' });
  }
});

app.delete('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const index = events.findIndex(e => e.id === id);
  if (index !== -1) {
    events.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Event not found' });
  }
});

app.get('/api/about', (req, res) => res.json(aboutData));
app.put('/api/about', (req, res) => {
  aboutData = { ...aboutData, ...req.body };
  res.json(aboutData);
});

app.get('/api/gallery', (req, res) => res.json(galleryItems));
app.post('/api/gallery', (req, res) => {
  const newItem = { ...req.body, id: Date.now().toString() };
  galleryItems.unshift(newItem);
  res.json(newItem);
});

app.put('/api/gallery/:id', (req, res) => {
  const { id } = req.params;
  const index = galleryItems.findIndex(item => item.id === id);
  if (index !== -1) {
    galleryItems[index] = { ...galleryItems[index], ...req.body };
    res.json(galleryItems[index]);
  } else {
    res.status(404).json({ error: 'Gallery item not found' });
  }
});

app.delete('/api/gallery/:id', (req, res) => {
  const { id } = req.params;
  const index = galleryItems.findIndex(item => item.id === id);
  if (index !== -1) {
    galleryItems.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Gallery item not found' });
  }
});

app.get('/api/contact', (req, res) => res.json(contactData));
app.put('/api/contact', (req, res) => {
  contactData = { ...contactData, ...req.body };
  res.json(contactData);
});

app.post('/api/register', (req, res) => {
  const { eventId, studentName, rollNo, email } = req.body;
  const event = events.find(e => e.id === eventId);
  const ticketId = `INF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const registration = { 
    eventId, 
    eventTitle: event?.title || 'Unknown Event',
    studentName, 
    rollNo, 
    email, 
    ticketId, 
    attended: false, 
    timestamp: new Date() 
  };
  registrations.push(registration);
  
  // Update event stats
  if (event) event.stats.registrations++;
  
  res.json(registration);
});

app.get('/api/registrations', (req, res) => res.json(registrations));

app.post('/api/mark-attendance', (req, res) => {
  const { ticketId } = req.body;
  const registration = registrations.find(r => r.ticketId === ticketId);
  if (!registration) return res.status(404).json({ error: 'Invalid Ticket' });
  
  if (registration.attended) return res.json({ message: 'Already marked', registration });
  
  registration.attended = true;
  const event = events.find(e => e.id === registration.eventId);
  if (event) event.stats.attendance++;
  
  res.json({ message: 'Attendance marked successfully', registration });
});

app.get('/api/stats', (req, res) => {
  const totalRegistrations = registrations.length;
  const totalAttendance = registrations.filter(r => r.attended).length;
  res.json({ totalRegistrations, totalAttendance, eventsCount: events.length });
});

app.get('/api/members', (req, res) => res.json(members));

app.post('/api/members', (req, res) => {
  const newMember = { ...req.body, id: Date.now().toString() };
  members.push(newMember);
  res.json(newMember);
});

app.put('/api/members/:id', (req, res) => {
  const { id } = req.params;
  const index = members.findIndex(m => m.id === id);
  if (index !== -1) {
    members[index] = { ...members[index], ...req.body };
    res.json(members[index]);
  } else {
    res.status(404).json({ error: 'Member not found' });
  }
});

app.delete('/api/members/:id', (req, res) => {
  const { id } = req.params;
  const index = members.findIndex(m => m.id === id);
  if (index !== -1) {
    members.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Member not found' });
  }
});

app.get('/api/achievements', (req, res) => res.json(achievements));

app.post('/api/achievements', (req, res) => {
  const newItem = { ...req.body, id: Date.now().toString() };
  achievements.unshift(newItem);
  res.json(newItem);
});

app.put('/api/achievements/:id', (req, res) => {
  const { id } = req.params;
  const index = achievements.findIndex(a => a.id === id);
  if (index !== -1) {
    achievements[index] = { ...achievements[index], ...req.body };
    res.json(achievements[index]);
  } else {
    res.status(404).json({ error: 'Achievement not found' });
  }
});

app.delete('/api/achievements/:id', (req, res) => {
  const { id } = req.params;
  const index = achievements.findIndex(a => a.id === id);
  if (index !== -1) {
    achievements.splice(index, 1);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Achievement not found' });
  }
});

app.post('/api/feedback', (req, res) => {
  feedback.push({ ...req.body, id: Date.now(), date: new Date() });
  res.json({ success: true });
});

export default app;
