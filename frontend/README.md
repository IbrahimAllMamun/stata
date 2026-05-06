# STATA - Student Welfare Organization Website

A modern, full-featured website for STATA, the student welfare organization of the Institute of Statistical Research and Training (ISRT), University of Dhaka.

## About STATA

STATA is dedicated to improving students' mental health and social bonding by organizing activities such as BBQ parties, Iftar Mahfil, tours, cricket tournaments, football tournaments, and more. STATA also serves as a bridge between current students and alumni to foster networking and mentorship.

**Mission:** Connecting Minds, Building Bonds, Nourishing Well-being.

## Features

### Public Features
- Home page with hero section and latest posts
- About page with organization mission and values
- Events page showcasing all STATA activities
- Gallery with event photos
- Contact page with form
- Blog/Posts system with social interactions

### User Features
- User registration and authentication
- User profiles with customizable information
- Like posts
- Comment on posts with real-time updates
- View and interact with community content

### Admin Features
- Admin dashboard with statistics
- Create, edit, and delete blog posts
- Manage events with image galleries
- Moderate comments
- Role-based access control

## Tech Stack

- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Routing:** React Router v6
- **Backend:** Supabase
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth (Email/Password)
- **Build Tool:** Vite

## Database Schema

The application uses the following database tables:

- **profiles** - User profile information
- **posts** - Blog posts and announcements
- **comments** - Comments on posts (with threading support)
- **likes** - Post likes tracking
- **events** - Organization events and activities

All tables have Row Level Security (RLS) enabled with appropriate policies.

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### 1. Clone the Repository

```bash
git clone <repository-url>
cd stata-website
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings under Settings > API.

### 4. Database Setup

The database schema has already been applied via migration. The following tables are created:
- profiles
- posts
- comments
- likes
- events

All necessary RLS policies and triggers are also set up automatically.

### 5. Create an Admin User

1. Sign up for an account through the website
2. Go to your Supabase dashboard
3. Navigate to Table Editor > profiles
4. Find your user and change the `role` field from `user` to `admin`

### 6. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 7. Build for Production

```bash
npm run build
```

The production build will be created in the `dist` directory.

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Layout.tsx      # Main layout wrapper
│   ├── Navigation.tsx  # Navigation bar
│   └── Footer.tsx      # Footer component
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── lib/               # Library configurations
│   ├── supabase.ts    # Supabase client
│   └── database.types.ts # TypeScript types
├── pages/             # Page components
│   ├── Home.tsx
│   ├── About.tsx
│   ├── Events.tsx
│   ├── Gallery.tsx
│   ├── Contact.tsx
│   ├── Posts.tsx
│   ├── PostView.tsx
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── Profile.tsx
│   └── admin/         # Admin pages
│       ├── Dashboard.tsx
│       ├── ManagePosts.tsx
│       ├── PostEditor.tsx
│       └── ManageEvents.tsx
├── App.tsx            # Main app component with routes
└── main.tsx          # Application entry point
```

## Color Palette

The website uses a university-themed, mental health-friendly color palette:

- **Primary Colors:**
  - Deep Navy Blue: `#1F2A44`
  - Royal Blue: `#2F5BEA`
  - White: `#FFFFFF`

- **Secondary Colors:**
  - Soft Green: `#2ECC71`
  - Light Gray: `#F5F7FA`
  - Dark Gray: `#4A4A4A`

- **Accent Colors:**
  - Warm Orange: `#F39C12`
  - Soft Red: `#E74C3C`

## Security

- All database tables have Row Level Security (RLS) enabled
- Authentication is handled securely via Supabase Auth
- Admin routes are protected with role-based access control
- User passwords are hashed and never stored in plain text
- All API calls use authenticated requests

## Features Roadmap

Future enhancements could include:

- Event registration system
- Alumni mentorship matching
- Forum/discussion board
- Real-time notifications
- Mobile app (React Native)
- Photo upload functionality
- Advanced search and filtering
- Email notifications
- User activity feed
- Batch-wise alumni directory

## Contributing

To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is created for STATA - Student Welfare Organization, ISRT, University of Dhaka.

## Support

For support or questions, please contact:
- Email: stata@isrt.ac.bd
- Website: [Your website URL]

---

Built with care for the STATA community at ISRT, University of Dhaka.
