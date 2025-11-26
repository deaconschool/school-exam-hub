# Development Setup Guide

This guide provides step-by-step instructions for setting up the School Examination Portal development environment.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn** package manager
- **Git** - [Download here](https://git-scm.com/)
- **VS Code** (recommended) with these extensions:
  - TypeScript and JavaScript Language Features
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - Prettier - Code formatter

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd school-exam-hub
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

To get these values:
1. Go to [supabase.com](https://supabase.com)
2. Create a new project or select an existing one
3. Navigate to Project Settings > API
4. Copy the Project URL and anon public key

### 4. Database Setup

#### Option A: Using Supabase Dashboard
1. Navigate to your Supabase project dashboard
2. Go to the SQL Editor
3. Run the migration files from `supabase/migrations/` in order
4. Insert initial data for stages, classes, and users

#### Option B: Using Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at:
- Local: `http://localhost:5173`
- Network: `http://192.168.x.x:5173` (if available)

## Development Workflow

### Code Structure

```
src/
├── components/          # Reusable components
├── pages/              # Route components
├── services/           # API calls and business logic
├── contexts/           # React contexts (Auth, Language)
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

### Common Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run TypeScript checks
npm run type-check

# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix
```

### Database Operations

All database operations are handled through:
- `src/services/supabaseService.ts` - Direct Supabase operations
- `src/services/adminService.ts` - Admin-specific business logic

### Authentication Flow

1. **Login**: Users authenticate via Supabase Auth
2. **Profile**: User profile determines role (student/teacher/admin)
3. **Authorization**: Route guards and component-level permission checks
4. **State**: AuthContext manages global authentication state

### Adding New Features

1. **Create Component**: Add new components to appropriate directory
2. **Add Route**: Update `src/App.tsx` with new route
3. **Service Layer**: Add API operations to relevant service file
4. **TypeScript**: Define types in `src/types/`
5. **Styling**: Use Tailwind CSS classes and shadcn/ui components

### Testing User Roles

After setting up the database, you can test different user roles:

**Admin Access**:
- Navigate to `/admin/login`
- Use admin credentials or create new admin user

**Teacher Access**:
- Navigate to `/teacher/login`
- Use teacher credentials

**Student Access**:
- Navigate to `/student/stages`
- Use student code or view as guest

## Common Issues and Solutions

### Environment Variables Not Working
- Ensure `.env` file is in project root
- Variables must start with `VITE_` prefix
- Restart development server after changing `.env`

### Database Connection Issues
- Verify Supabase URL and keys are correct
- Check network connectivity
- Ensure Row Level Security policies allow access

### TypeScript Errors
- Run `npm run type-check` to see all type errors
- Ensure all imports have proper type definitions
- Check `src/types/` for missing type definitions

### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for missing environment variables
- Ensure all imports are properly resolved

## Best Practices

### Code Style
- Use TypeScript strict mode
- Follow existing naming conventions
- Add comments for complex logic
- Use descriptive variable and function names

### Component Development
- Use functional components with hooks
- Implement proper error boundaries
- Add loading states for async operations
- Make components responsive by default

### Database Operations
- Always handle errors gracefully
- Use TypeScript types for database responses
- Implement proper data validation
- Use transactions for multi-table operations

### Security
- Never expose sensitive data in frontend
- Use environment variables for configuration
- Validate all user inputs
- Implement proper authentication checks

## Getting Help

If you encounter issues:

1. Check the browser console for error messages
2. Review the Supabase logs for database issues
3. Check the Network tab in browser dev tools
4. Refer to the main README.md for project overview
5. Contact the development team for support

## Contributing

1. Create a new branch for your feature: `git checkout -b feature-name`
2. Make your changes and test thoroughly
3. Follow the code style and patterns
4. Commit your changes with descriptive messages
5. Push and create a pull request for review